import handlersFunc from "../utils/handlers.js";
import {processCandidates, SetupFreshConnection} from "./common_webrtc.js";
import connectionFuncSig from "./broadcast.js";
import actionToHandler from "../utils/action_to_handler.js";
import {delay, delayReject} from "../utils/timer.js";

export function createDataChannel(id, logger) {
    const handlers = handlersFunc(["error", "open", "message", "beforeclose", "close"]);
    let isConnected = false;
    let dataChannel = null;
    let clientId = null;

    const candidateWaiter = Promise.withResolvers();

    let peerConnection = null;
    let offer = null;


    const localCandidates = [];

    const connectionPromise = Promise.withResolvers();

    const send = (action, data, to, ignore) => {
        if (!isConnected) {
            console.error("Not connected");
            return false;
        }
        if (!clientId) {
            console.error("No client");
            console.trace("How");
        }
        if (to === undefined) {
            to = clientId;
        }
        if (to !== "all" && to !== clientId) {
            console.error("Bad client", to, clientId);
            console.trace("Bad client");
        }
        if (!dataChannel) {
            console.error("Not data channel");
            return false;
        }
        // const json = {from: id, to: clientId, action, data};
        const json = {from: id, to, action, data, ignore};
        logger.log("Sending [" + id + "] to [" + to + "]: " + JSON.stringify(data));
        const str = JSON.stringify(json);
        return dataChannel.send(str);
    };

    async function placeOfferAndWaitCandidates() {
        peerConnection = SetupFreshConnection(id, logger, localCandidates, candidateWaiter);

        dataChannel = peerConnection.createDataChannel("gamechannel"+id);

        logger.log("datachanid " + dataChannel.id);

        setupDataChannel(dataChannel);

        // const sdpConstraints = {offerToReceiveAudio: false, offerToReceiveVideo: false};

        offer = await peerConnection.createOffer();
        // await delay(1000);
        await peerConnection.setLocalDescription(offer);
        return getCandidates();
    }

    async function setAnswerAndCand(data) {
        clientId = data.id;
        const answer = {type: "answer", sdp: data.sdp};
        await peerConnection.setRemoteDescription(answer);
        await processCandidates(data.c, peerConnection);
    }

    function getOfferAndCands() {
        return {
            offer,
            c: localCandidates
        };
    }

    function getCandidates() {
        return candidateWaiter.promise;
    }

    function setupDataChannel(dataChannel) {
        dataChannel.onmessage = function (e) {
            logger.log("data get " + e.data);
            const json = JSON.parse(e.data);
            return handlers.call("message", json);
        };

        dataChannel.onopen = function () {
            logger.log("------ DATACHANNEL OPENED ------");
            isConnected = true;
            connectionPromise.resolve(id);
            return handlers.call("open", id);
        };

        dataChannel.onclose = function () {
            logger.log("------ DC closed! ------");
            isConnected = false;
            return handlers.call("close", id);
        };

        dataChannel.onerror = function () {
            logger.error("DC ERROR!!!");
        };
    }

    const close = async () => {
        // iphone fires "onerror" on close socket
        await handlers.call("beforeclose", id);
        if (isConnected) {
            isConnected = false;
            if (dataChannel) {
                dataChannel.close();
            }
        }
    };

    const on = handlers.on;

    const ready = () => connectionPromise.promise;

    async function getDataToSend() {
        const offerPromise = placeOfferAndWaitCandidates();
        const timer = delay(2000);
        await Promise.race([offerPromise, timer]);
        const dataToSend = getOfferAndCands();
        dataToSend.id = id;
        return dataToSend;
    }

    async function connect(dataToSend, answerAndCandPromise, signalingChan) {
        if (signalingChan) {
            const sigConnection = connectionFuncSig(id, logger, signalingChan);
            const openConPromise = Promise.withResolvers();
            const actions = {
                "offer_and_cand": async (data) => {
                    answerAndCandPromise.resolve(data);
                    const openCon = await openConPromise.promise;
                    return Promise.race([connectionPromise.promise, delayReject(2000)]).catch(() => {
                        if (clientId != null) {
                            openCon.sendRawTo("stop_waiting", {}, clientId);
                            connectionPromise.reject("timeout7");
                        }
                    });
                }
            };
            const handlers = actionToHandler(actions);

            sigConnection.on("join", async (data) => {
                logger.log(data);
                const openCon = await openConPromise.promise;
                clientId ??= data.from;
                if (clientId === data.from) {
                    openCon.sendRawTo("offer_and_cand", dataToSend, clientId);
                }
            });

            const openCon = await sigConnection.connect();
            openConPromise.resolve(openCon);
            openCon.registerHandler(handlers);
        }
        const answerAndCand = await answerAndCandPromise.promise;
        await setAnswerAndCand(answerAndCand);
        logger.log("after set", answerAndCand);
    }

    const getOtherId = () => clientId;

    return {on, send, close, ready, connect, getDataToSend, getOtherId};
}

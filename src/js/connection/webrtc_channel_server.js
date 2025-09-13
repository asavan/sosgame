import handlersFunc from "../utils/handlers.js";
import {processCandidates, SetupFreshConnection} from "./common_webrtc.js";
import connectionFuncSig from "./broadcast.js";
import actionToHandler from "../utils/action_to_handler.js";
import {delay, delayReject} from "../utils/timer.js";

export function createDataChannel(window, settings, id, logger, signalingChan) {
    const handlers = handlersFunc(["error", "open", "message", "beforeclose", "close"], null, "datachan");
    let isConnected = !!signalingChan;
    let dataChannel = null;
    let clientId = null;

    const candidateWaiter = Promise.withResolvers();

    let peerConnection = null;
    let offer = null;


    const localCandidates = [];

    const connectionPromise = Promise.withResolvers();

    const send = (action, data) => {
        if (!isConnected) {
            console.error("Not connected");
            return false;
        }
        if (!clientId) {
            console.error("No client");
            console.trace("How");
        }
        if (!dataChannel) {
            console.error("Not data channel");
            return signalingChan.send(action, data, clientId);
        }
        const json = {from: id, to: clientId, action, data};
        logger.log("Sending [" + id + "] to [" + clientId + "]: " + JSON.stringify(data));
        const str = JSON.stringify(json);
        return dataChannel.send(str);
    };

    async function placeOfferAndWaitCandidates() {
        peerConnection = SetupFreshConnection(id, logger, localCandidates, candidateWaiter);
        // window.pc = peerConnection;

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
            if (signalingChan) {
                signalingChan.close();
            }
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

    async function connect(dataToSend, answerAndCandPromise) {
        if (signalingChan) {
            const sigConnection = connectionFuncSig(id, logger, signalingChan);

            const actions = {
                "offer_and_cand": (data) => {
                    answerAndCandPromise.resolve(data);
                    return Promise.race([connectionPromise.promise, delayReject(2000)]).catch(() => {
                        if (clientId != null) {
                            sigConnection.sendRawTo("stop_waiting", {}, clientId);
                            connectionPromise.reject("timeout7");
                        }
                    });
                }
            };
            const handlers = actionToHandler(actions);

            sigConnection.on("join", (data) => {
                logger.log(data);
                if (clientId == null) {
                    clientId = data.from;
                }
                if (clientId === data.from) {
                    sigConnection.sendRawTo("offer_and_cand", dataToSend, clientId);
                }
                return Promise.resolve();
            });

            sigConnection.registerHandler(handlers);
            await sigConnection.connect();
        }
        const answerAndCand = await answerAndCandPromise.promise;
        await setAnswerAndCand(answerAndCand);
        logger.log("after set", answerAndCand);
    }
    return {on, send, close, ready, connect, getDataToSend};
}

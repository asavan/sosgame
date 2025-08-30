import handlersFunc from "../utils/handlers.js";
import {processCandidates} from "./common_webrtc.js";

const connectionFunc = function (id, logger) {
    logger.log("Webrtc connection " + id);
    const handlers = handlersFunc(["open", "error", "close", "join", "gameinit", "disconnect"]);

    const candidateWaiter = Promise.withResolvers();
    const dataChanelWaiter = Promise.withResolvers();

    const clients = {};
    const localCandidates = [];
    let dataChannel = null;
    let peerConnection = null;
    let offer = null;

    let externalHandlers = null;

    function registerHandler(handler) {
        externalHandlers = handler;
    }

    function on(name, f) {
        return handlers.on(name, f);
    }

    function SetupFreshConnection(id) {
        const peerConnection = new RTCPeerConnection(null);
        // window.pc = peerConnection;

        peerConnection.onicecandidate = e => {
            logger.log("Received icecandidate", id, e);
            if (!e) {
                console.error("No ice");
            }
            const message = {
                type: "candidate",
                candidate: null,
            };
            if (e.candidate) {
                message.candidate = e.candidate.candidate;
                message.sdpMid = e.candidate.sdpMid;
                message.sdpMLineIndex = e.candidate.sdpMLineIndex;
            }
            localCandidates.push(message);

            if (!e.candidate) {
                candidateWaiter.resolve(localCandidates);
            }
        };

        return peerConnection;
    }


    //init

    async function placeOfferAndWaitCandidates() {
        peerConnection = SetupFreshConnection(id);
        // window.pc = peerConnection;
        peerConnection.oniceconnectionstatechange = (e) => {
            logger.log("connection statechange", e);
            if (peerConnection.iceConnectionState === "failed") {
                console.error("failed");
                // peerConnection.restartIce();
            }
        };

        dataChannel = peerConnection.createDataChannel("gamechannel"+id);

        setupDataChannel(dataChannel, id, clients);

        // const sdpConstraints = {offerToReceiveAudio: false, offerToReceiveVideo: false};

        offer = await peerConnection.createOffer();
        // await delay(1000);
        await peerConnection.setLocalDescription(offer);
        return candidateWaiter.promise;
    }

    const sendRawAll = (action, data, ignore) => {
        console.log("Sending raw all");
        logger.log("sending", data);
        const json = {from: id, to: "all", action, data};
        for (const [id, client] of Object.entries(clients)) {
            if (ignore && ignore.includes(id)) {
                logger.log("ignore " + id);
                continue;
            }
            if (client.dc) {
                try {
                    client.dc.send(JSON.stringify(json));
                } catch (e) {
                    console.log(e, client);
                }
            } else {
                console.error("No connection", client);
            }
        }
    };

    const sendRawTo = (action, data, to) => {
        const json = {from: id, to, action, data};
        const client = clients[to];
        if (!client || !client.dc) {
            logger.log("No chanel " + to);
            return;
        }
        return client.dc.send(JSON.stringify(json));
    };

    function setupDataChannel(dataChannel, id, clients) {
        dataChannel.onmessage = function (e) {
            logger.log("get data " + e.data);
            const json = JSON.parse(e.data);
            if (handlers.hasAction(json.action)) {
                logger.log("handlers.actionKeys");
                return handlers.call(json.action, json);
            }
            if (externalHandlers && externalHandlers.hasAction(json.action)) {
                logger.log("callCurrentHandler");
                return externalHandlers.call(json.action, json.data);
            }
            logger.log("Unknown action " + json.action);
        };

        dataChannel.onopen = function () {
            logger.log("------ DATACHANNEL OPENED ------");
            // TODO make sendRawTo to send to this dataChannel
            dataChanelWaiter.resolve({sendRawAll, sendRawTo, on});
            return handlers.call("open", {sendRawTo, id});
        };

        dataChannel.onclose = async function () {
            logger.log("------ DATACHANNEL CLOSED ------");
            await handlers.call("disconnect", id);
            delete clients[id];
        };

        dataChannel.onerror = function () {
            console.error("DC ERROR!!!");
            return handlers.call("disconnect", id);
        };
    }

    async function setAnswerAndCand(data) {
        const id = data.id;
        const client = clients[data.id];
        if (client) {
            client.pc.close();
        }
        clients[id] = {pc: peerConnection, dc: dataChannel};
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

    return {
        on,
        registerHandler,
        sendRawTo,
        sendRawAll,
        placeOfferAndWaitCandidates,
        setAnswerAndCand,
        getOfferAndCands
    };
};

export default connectionFunc;

import handlersFunc from "../utils/handlers.js";
import {processCandidates} from "./common_webrtc.js";

const connectionFunc = function (id, logger) {
    const localCandidates = [];
    const candidateWaiter = Promise.withResolvers();

    const handlers = handlersFunc(["recv", "open", "error", "close", "join", "gameinit"]);
    let currentHandler = {};
    let queue;


    function registerHandler(handler, q) {
        queue = q;
        currentHandler = handler;
    }

    function callCurrentHandler(method, data) {
        const callback = currentHandler[method];
        if (typeof callback !== "function") {
            logger.log("Not function");
            return;
        }
        if (!queue) {
            logger.log("No queue");
            return;
        }
        queue.add(() => callback(data.data, data.from));
    }

    function on(name, f) {
        return handlers.on(name, f);
    }

    // init
    let isConnected = false;
    let dataChannel = null;

    const sendRawTo = (action, data, to) => {
        if (!dataChannel) {
            console.error("Not channel");
            return false;
        }
        if (!isConnected) {
            console.error("Not connected");
            return false;
        }
        const json = {from: id, to, action, data};
        return dataChannel.send(JSON.stringify(json));
    };

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
                logger.log("No candidate");
                candidateWaiter.resolve(localCandidates);
            }
        };

        return peerConnection;
    }

    async function processOffer(offerAndcandidates) {
        logger.error(offerAndcandidates);
        const peerConnection = SetupFreshConnection(id);

        peerConnection.ondatachannel = (ev) => {
            dataChannel = ev.channel;
            setupDataChannel(ev.channel);
        };
        const offer = offerAndcandidates.offer;
        await peerConnection.setRemoteDescription(offer);
        await processCandidates(offerAndcandidates.c, peerConnection);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        return answer;
    }

    function getCandidates() {
        return candidateWaiter.promise;
    }

    function setupDataChannel(dataChannel) {
        dataChannel.onmessage = function (e) {
            logger.log("data get " + e.data);
            const json = JSON.parse(e.data);
            if (handlers.actionKeys().includes(json.action)) {
                logger.log("handlers.actionKeys");
                return handlers.call(json.action, json);
            }
            if (Object.keys(currentHandler).includes(json.action)) {
                logger.log("callCurrentHandler");
                return callCurrentHandler(json.action, json);
            }
        };

        dataChannel.onopen = function () {
            logger.log("------ DATACHANNEL OPENED ------");
            isConnected = true;
            handlers.call("open", {id, sendRawTo});
        };

        dataChannel.onclose = function () {
            logger.log("------ DC closed! ------");
            isConnected = false;
        };

        dataChannel.onerror = function () {
            logger.error("DC ERROR!!!");
        };
    }

    return {processOffer, on, registerHandler, sendRawTo, getCandidates};
};

export default connectionFunc;

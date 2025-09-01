import handlersFunc from "../utils/handlers.js";
import {processCandidates, SetupFreshConnection} from "./common_webrtc.js";

const connectionFunc = function (id, logger) {
    const localCandidates = [];
    const candidateWaiter = Promise.withResolvers();

    const handlers = handlersFunc(["open", "error", "close", "join", "gameinit"]);

    let externalHandlers = null;

    function registerHandler(handler) {
        externalHandlers = handler;
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

    async function processOffer(offerAndCandidates) {
        const peerConnection = SetupFreshConnection(id, logger, localCandidates, candidateWaiter);

        peerConnection.ondatachannel = (ev) => {
            dataChannel = ev.channel;
            setupDataChannel(ev.channel);
        };
        const offer = offerAndCandidates.offer;
        await peerConnection.setRemoteDescription(offer);
        await processCandidates(offerAndCandidates.c, peerConnection);
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
            if (handlers.hasAction(json.action)) {
                logger.log("handlers.actionKeys");
                return handlers.call(json.action, json);
            }
            if (externalHandlers && externalHandlers.hasAction(json.action)) {
                logger.log("callCurrentHandler client");
                return externalHandlers.call(json.action, json.data);
            }
            logger.log("Unknown action " + json.action);
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

import {handlersFunc, delay} from "netutils";


export function SetupFreshConnection(logger) {
    const peerConnection = new RTCPeerConnection();

    // peerConnection.onicecandidate = e => {
    //     if (!e) {
    //         logger.error("No ice");
    //         return;
    //     }
    //     if (!e.candidate) {
    //         logger.log("Last cand");
    //     } else {
    //         logger.log("Received icecandidate", e);
    //     }
    // };



    peerConnection.onsignalingstatechange = (ev) => {
        logger.log("signaling state change " + peerConnection.signalingState, ev);
    };

    peerConnection.onicecandidateerror = (ev) => {
        if (ev.errorCode === 701) {
            logger.log("ONICECANDIDATEERROR " + ev.url + " " + ev.errorText);
        } else {
            logger.log("ONICECANDIDATEERROR", ev);
        }
    };

    return peerConnection;
}

export function createDataChannel(logger, initiator) {
    const handlers = handlersFunc(["error", "open", "message", "beforeclose", "close", "remote"]);
    let peerConnection = null;
    let isConnected = false;
    let dataChannel = null;

    let reconnectCount = 0;

    let connectionPromise = Promise.withResolvers();

    const resetPromises = () => {
        connectionPromise = Promise.withResolvers();
    };

    peerConnection = SetupFreshConnection(logger);

    peerConnection.ondatachannel = (ev) => {
        if (initiator) {
            logger.error("ERROR Received datachannel");
        } else {
            logger.log("Received datachannel");
        }
        dataChannel = ev.channel;
        setupDataChannel(ev.channel);
    };

    peerConnection.oniceconnectionstatechange = (e) => {
        logger.log("connection state change " + peerConnection.iceConnectionState);
        if (peerConnection.iceConnectionState === "failed" || peerConnection.iceConnectionState === "disconnected") {
            logger.error("failed iceConnectionState " + peerConnection.iceConnectionState, e);
            resetPromises();
        }
    };

    peerConnection.onnegotiationneeded = (ev) => {
        logger.log("ONNEGOTIATIONNEEDED", ev);
    };

    peerConnection.onicegatheringstatechange = (ev) => {
        logger.log("onicegatheringstatechange", ev);
        const connection = ev.target;

        switch (connection.iceGatheringState) {
        case "gathering":
            logger.log("gathering", ev);
            break;
        case "complete": {
            logger.log("gathering complete");
            handlers.call("remote", peerConnection.localDescription);
            break;
        }
        }
    };

    peerConnection.onclosing = (ev) => {
        logger.log("Received closing", ev);
    };

    const createOffer = async (otherId) => {
        if (!initiator) {
            logger.error("NOT INITIATOR CREATE OFFER");
        }
        if (reconnectCount === 0) {
            dataChannel = peerConnection.createDataChannel("gamechannel" + otherId);
        } else {
            dataChannel = peerConnection.createDataChannel("chanReconnect" + reconnectCount + otherId);
        }
        logger.log("datachanid " + dataChannel.id, dataChannel.label);
        setupDataChannel(dataChannel);
        logger.log("createOffer before delay " + dataChannel.label);
        // await delay(100);
        logger.log("createOffer after delay " + dataChannel.id);
        await peerConnection.setLocalDescription();
        logger.log("createOffer after setLocalDescription " + dataChannel.id);
    };

    const send = (data) => {
        if (!isConnected) {
            console.error("Not connected");
            return false;
        }
        if (!dataChannel) {
            console.error("Not data channel");
            return false;
        }
        const str = JSON.stringify(data);
        return dataChannel.send(str);
    };

    async function processOffer(offer) {
        if (initiator) {
            logger.error("ERROR NON Initiator", initiator, offer);
        }
        logger.log("Before set offer");
        await peerConnection.setRemoteDescription(offer);
        logger.log("After set offer", offer);
        await delay(500);
        logger.log("After set offer and delay");
        await peerConnection.setLocalDescription();
        logger.log("AFTER set answer", JSON.stringify(peerConnection.localDescription));
    }

    async function processAnswer(answer) {
        logger.log("Before set answer", answer);
        await peerConnection.setRemoteDescription(answer);
        logger.log("After set answer", answer);
        await delay(200);
        logger.log("After set answer and delay");
    }

    function setupDataChannel(dataChannel) {
        // resetPromises();
        dataChannel.onmessage = function (e) {
            logger.log("data get " + e.data);
            const json = JSON.parse(e.data);
            return handlers.call("message", json);
        };

        dataChannel.onopen = function () {
            isConnected = true;
            logger.log("------ DATACHANNEL OPENED ------");
            const sctp = peerConnection.sctp;
            const maxMessageSize = sctp.maxMessageSize;
            logger.log("datachanid " + dataChannel.id + " " + dataChannel.label + " " + JSON.stringify(sctp.transport.iceTransport.getSelectedCandidatePair()));
            logger.log("chan " + dataChannel.protocol + " " + dataChannel.reliable + " " + dataChannel.priority);
            logger.log("chan2 " + dataChannel.ordered + " " + dataChannel.binaryType + " ");

            connectionPromise.resolve(dataChannel.label);
            return handlers.call("open", dataChannel.label);
        };

        dataChannel.onclosing = (event) => {
            logger.log("------ DC closing! ------", event);
            isConnected = false;
            return handlers.call("beforeclose", {});
        };

        dataChannel.onclose = function () {
            logger.log("------ DC closed! ------");
            isConnected = false;
            ++reconnectCount;
            peerConnection.restartIce();
            return handlers.call("close", {});
        };

        dataChannel.onerror = function (e) {
            logger.error("DC ERROR!!!", e);
        };
    }

    const close = async () => {
        connectionPromise.reject("close");
        // iphone fires "onerror" on close socket
        await handlers.call("beforeclose", {});
        if (isConnected) {
            isConnected = false;
            if (dataChannel) {
                dataChannel.close();
            }
        }
    };


    const ready = () => connectionPromise.promise;

    return {...handlers, send, close, ready, resetPromises, createOffer, processOffer, processAnswer};
}

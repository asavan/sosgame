import handlersFunc from "../utils/handlers.js";

const connectionFunc = function (id, logger) {
    logger.log("Webrtc connection " + id);
    const handlers = handlersFunc(["recv", "open", "error", "close", "socket_open", "socket_close", "disconnect"]);

    const candidateWaiter = Promise.withResolvers();
    const dataChanelWaiter = Promise.withResolvers();

    const clients = {};
    const localCandidates = [];
    let dataChannel = null;
    let peerConnection = null;
    let offer = null;
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
                candidateWaiter.resolve({c: localCandidates, sdp: offer.sdp});
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
        logger.log(data);
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
            return handlers.call("recv", e.data);
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

    function registerHandler(actions, queue) {
        handlers.setOnce("recv", (data) => {
            // console.log(data);
            const obj = JSON.parse(data);
            const res = obj.data;
            const callback = actions[obj.action];
            if (typeof callback === "function") {
                queue.add(() => callback(res, obj.from));
            }
        });
    }

    async function setAnswerAndCand(data) {
        const answer = {type: "answer", sdp: data.sdp};
        await peerConnection.setRemoteDescription(answer);
        for (const candMessage of data.candidates) {
            if (!candMessage.candidate) {
                await peerConnection.addIceCandidate(null);
            } else {
                await peerConnection.addIceCandidate(candMessage);
            }
        }
    }

    function getOfferAndCands() {
        return {
            sdp: offer.sdp,
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

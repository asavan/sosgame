import handlersFunc from "../utils/handlers.js";

const connectionFunc = function (id, logger, isServer, settings) {
    const user = id;
    const localCandidates = [];
    const candidateWaiter = Promise.withResolvers();
    const dataChanelWaiter = Promise.withResolvers();

    const handlers = handlersFunc(["recv", "open", "error", "close", "socket_open", "socket_close"]);
    function on(name, f) {
        return handlers.on(name, f);
    }

    // init
    let isConnected = false;
    let dataChannel = null;

    const sendRawTo = (action, data, to) => {
        if (!dataChannel) {
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
                localCandidates.push(e.candidate);
            }

            if (!e.candidate) {
                candidateWaiter.resolve({c: localCandidates});
            }
        };

        return peerConnection;
    }

    async function processOffer(offerAndcandidates) {
        const peerConnection = SetupFreshConnection(id);

        peerConnection.ondatachannel = (ev) => {
            setupDataChannel(ev.channel);
        };
        const offer = {"type": "offer", "sdp": offerAndcandidates.sdp};
        await peerConnection.setRemoteDescription(offer);
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
            handlers.call("recv", e.data);
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
            console.log("DC ERROR!!!");
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

    return {processOffer, on, registerHandler, sendRawTo, getCandidates};
};

export default connectionFunc;

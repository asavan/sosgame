import handlersFunc from "../utils/handlers.js";
import {processCandidates, SetupFreshConnection} from "./common_webrtc.js";
import connectionFuncSig from "./broadcast.js";
import actionToHandler from "../utils/action_to_handler.js";
import {delay} from "../utils/timer.js";

import LZString from "lz-string";

async function clientOfferPromise(window, networkOfferPromise) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const connectionStr = urlParams.get("c");
    if (!connectionStr) {
        const offerAndCandidates = await networkOfferPromise;
        return offerAndCandidates;
    }
    const offerAndCandidatesStr = LZString.decompressFromEncodedURIComponent(connectionStr);
    const offerAndCandidates = JSON.parse(offerAndCandidatesStr);
    return offerAndCandidates;
}

export function createDataChannel(window, settings, id, logger, signalingChan) {
    const handlers = handlersFunc(["error", "open", "message", "beforeclose", "close"]);
    let isConnected = !!signalingChan;
    let dataChannel = null;
    let serverId = null;

    const localCandidates = [];
    const candidateWaiter = Promise.withResolvers();

    const connectionPromise = Promise.withResolvers();

    const send = (action, data) => {
        if (!isConnected) {
            console.error("Not connected");
            return false;
        }
        if (!serverId) {
            console.error("No server");
            console.trace("How");
        }
        if (!dataChannel) {
            console.error("Not data channel");
            return signalingChan.send(action, data, serverId);
        }
        const json = {from: id, to: serverId, action, data};
        logger.log("Sending [" + id + "] to [" + serverId + "]: " + JSON.stringify(data));
        const str = JSON.stringify(json);
        return dataChannel.send(str);
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

    async function connect() {
        const networkPromise = Promise.withResolvers();
        const sigConnectionPromise = Promise.withResolvers();
        if (signalingChan) {
            const sigConnection = connectionFuncSig(id, logger, signalingChan);
            console.error("setup gameinit 22");
            sigConnection.on("gameinit", (data) => {
                console.log(data);
                serverId = data.from;
                sigConnection.dispose();
                connectionPromise.reject("timeout3");
                networkPromise.reject("timeout");
                return Promise.resolve();
            });
            const actions = {
                "offer_and_cand": (data) => {
                    networkPromise.resolve(data);
                    return Promise.resolve();
                },
                "stop_waiting": () => {
                    connectionPromise.reject("timeout2");
                    networkPromise.reject("timeout5");
                    return Promise.resolve();
                }
            };
            const handlers = actionToHandler(null, actions);
            sigConnection.registerHandler(handlers);
            await sigConnection.connect();
            sigConnectionPromise.resolve(sigConnection);
            sigConnection.sendRawAll("join", {});
        } else {
            networkPromise.reject("No chan");
            // sigConnectionPromise.reject("No chan");
        }

        console.error("setup gameinit 23");
        const offerAndCandidates = await clientOfferPromise(window, networkPromise.promise);
        console.error("setup gameinit 24");
        serverId = offerAndCandidates.id;
        const answer = await processOffer(offerAndCandidates);
        const timer = delay(2000);
        const candidatesPromice = getCandidates();
        const cands = await Promise.race([candidatesPromice, timer]);

        const dataToSend = {sdp: answer.sdp, id};
        if (cands) {
            dataToSend.c = cands;
        }
        console.error("setup gameinit 27");
        if (signalingChan) {
            const sigConnection = await sigConnectionPromise.promise;
            sigConnection.sendRawTo("offer_and_cand", dataToSend, serverId);
        }

        return dataToSend;
    }
    return {on, send, close, ready, connect};
}

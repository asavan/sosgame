import connectionFunc from "../connection/client_webrtc.js";
import connectionFuncSig from "../connection/broadcast.js";

import netObj from "./net.js";
import {makeQrPlain} from "../views/qr_helper.js";
import {delay} from "../utils/helper.js";

import LZString from "lz-string";
import {showGameView} from "../views/section_view.js";
import loggerFunc from "../views/logger.js";
import addSettingsButton from "../views/settings-form-btn.js";
import {beginGame} from "./client_helper.js";
import PromiseQueue from "../utils/async-queue.js";

import createSignalingChannel from "../connection/channel_with_name_client.js";
import actionToHandler from "../utils/action_to_handler.js";

async function clientOfferPromise(window, networkPromise) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const connectionStr = urlParams.get("c");
    if (!connectionStr) {
        const offerAndCandidates = await networkPromise;
        return offerAndCandidates;
    }
    const offerAndCandidatesStr = LZString.decompressFromEncodedURIComponent(connectionStr);
    const offerAndCandidates = JSON.parse(offerAndCandidatesStr);
    return offerAndCandidates;
}

export default async function gameMode(window, document, settings, gameFunction) {
    addSettingsButton(document, settings);
    const mainSection = document.querySelector(".game");
    mainSection.classList.add("hidden");
    const networkLogger = loggerFunc(document, settings);
    const myId = netObj.getMyId(window, settings, Math.random);
    const queue = PromiseQueue(networkLogger);
    const gameChannelPromise = createSignalingChannel(myId, window.location, settings, networkLogger);
    const connection = connectionFunc(myId, networkLogger);
    const gamePromise = Promise.withResolvers();
    connection.on("open", () => {
        networkLogger.log("open");
        showGameView(document);
        connection.sendRawTo("join", {}, "all");
        networkLogger.log("after send");
    });

    connection.on("gameinit", (data) => {
        const game = beginGame(window, document, settings, gameFunction,
            networkLogger, connection, connection, data, queue);
        gameChannelPromise.then(chan => {
            chan.close();
        });
        gamePromise.resolve(game);
    });
    const networkPromise = Promise.withResolvers();
    const sigConnectionPromise = Promise.withResolvers();
    gameChannelPromise.then(async chan => {
        const sigConnection = connectionFuncSig(myId, networkLogger, chan);
        const actions = {
            "offer_and_cand": (data) => {
                networkPromise.resolve(data);
            }
        };
        const handlers = actionToHandler(null, actions);
        sigConnection.registerHandler(handlers);
        await sigConnection.connect();
        sigConnectionPromise.resolve(sigConnection);
        sigConnection.sendRawAll("join", {});
        // sigConnection.sendRawAll("offer_and_cand", dataToSend);
    });

    const offerAndCandidates = await clientOfferPromise(window, networkPromise.promise);
    const serverId = offerAndCandidates.id;
    const answer = await connection.processOffer(offerAndCandidates);
    const timer = delay(2000);
    const candidatesPromice = connection.getCandidates();
    const cands = await Promise.race([candidatesPromice, timer]);

    const dataToSend = {sdp: answer.sdp, id: myId};
    if (cands) {
        dataToSend.c = cands;
    }
    sigConnectionPromise.promise.then((sigConnection) => {
        sigConnection.sendRawTo("offer_and_cand", dataToSend, serverId);
    });
    const jsonString = JSON.stringify(dataToSend);
    const encoded2 = LZString.compressToEncodedURIComponent(jsonString);
    const qr = makeQrPlain(encoded2, document, ".qrcode");
    console.log(qr);
    return gamePromise.promise;
}

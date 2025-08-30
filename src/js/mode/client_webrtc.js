import connectionFunc from "../connection/client_webrtc.js";
import netObj from "./net.js";
import {makeQrPlain} from "../views/qr_helper.js";
import {delay} from "../utils/helper.js";

import LZString from "lz-string";
import {showGameView} from "../views/section_view.js";
import loggerFunc from "../views/logger.js";
import addSettingsButton from "../views/settings-form-btn.js";
import {beginGame} from "./client_helper.js";
import PromiseQueue from "../utils/async-queue.js";

export default async function gameMode(window, document, settings, gameFunction) {
    addSettingsButton(document, settings);
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const mainSection = document.querySelector(".game");
    mainSection.classList.add("hidden");
    const connectionStr = urlParams.get("c");
    const networkLogger = loggerFunc(document, settings);
    const myId = netObj.getMyId(window, settings, Math.random);
    const queue = PromiseQueue(networkLogger);
    const connection = connectionFunc(myId, networkLogger);
    const offerAndCandidatesStr = LZString.decompressFromEncodedURIComponent(connectionStr);
    const offerAndCandidates = JSON.parse(offerAndCandidatesStr);
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
        gamePromise.resolve(game);
    });

    const answer = await connection.processOffer(offerAndCandidates);
    const timer = delay(2000);
    const candidatesPromice = connection.getCandidates();
    const cands = await Promise.race([candidatesPromice, timer]);

    const dataToSend = {sdp: answer.sdp, id: myId};
    if (cands) {
        dataToSend.c = cands;
    }
    const jsonString = JSON.stringify(dataToSend);
    const encoded2 = LZString.compressToEncodedURIComponent(jsonString);
    const qr = makeQrPlain(encoded2, document, ".qrcode");
    console.log(qr);
    return gamePromise.promise;
}

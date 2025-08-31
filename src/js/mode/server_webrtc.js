import connectionFunc from "../connection/server_webrtc.js";
import connectionFuncSig from "../connection/broadcast.js";

import netObj from "./net.js";
import {makeQrPlain} from "../views/qr_helper.js";
import {delay, removeElem} from "../utils/helper.js";
import scanBarcode from "../views/barcode.js";
import LZString from "lz-string";
import loggerFunc from "../views/logger.js";
import addSettingsButton from "../views/settings-form-btn.js";
import {beginGame} from "./server_helper.js";
import createSignalingChannel from "../connection/channel_with_name.js";
import actionToHandler from "../utils/action_to_handler.js";

function showReadBtn(window, document, logger) {
    const barCodeReady = Promise.withResolvers();
    const qrBtn = document.querySelector(".qr-btn");
    qrBtn.classList.remove("hidden");
    qrBtn.addEventListener("click", async () => {
        let codes = await scanBarcode(window, document, logger);
        logger.log(codes);
        if (!codes) {
            const sign = prompt("Get code from qr");
            if (sign == null) {
                barCodeReady.reject();
                return;
            }
            codes = sign;
        }
        const decode = LZString.decompressFromEncodedURIComponent(codes);
        barCodeReady.resolve(JSON.parse(decode));
    });

    return barCodeReady.promise;
}

export default async function gameMode(window, document, settings, gameFunction) {
    const networkLogger = loggerFunc(document, settings);
    addSettingsButton(document, settings);
    const myId = netObj.getMyId(window, settings, Math.random);
    const connection = connectionFunc(myId, networkLogger);
    const mainSection = document.querySelector(".game");
    mainSection.classList.add("hidden");

    const offerPromice = connection.placeOfferAndWaitCandidates();
    const gameChannelPromise = createSignalingChannel(myId, window.location, settings, networkLogger);
    const timer = delay(2000);
    await Promise.race([offerPromice, timer]);
    const dataToSend = connection.getOfferAndCands();
    const currentUrl = new URL(window.location.href);
    const urlWithoutParams = currentUrl.origin + currentUrl.pathname;
    const baseUrl = urlWithoutParams || "https://asavan.github.io/sosgame/";
    const jsonString = JSON.stringify(dataToSend);
    const encoded2 = LZString.compressToEncodedURIComponent(jsonString);
    const url2 = baseUrl + "?c=" + encoded2;
    const qr = makeQrPlain(url2, document, ".qrcode");

    const answerAndCandPromise = Promise.withResolvers();
    gameChannelPromise.then(chan => {
        const sigConnection = connectionFuncSig(myId, networkLogger, chan);

        const actions = {
            "offer_and_cand": (data) => {
                answerAndCandPromise.resolve(data);
            },
            "joinsig": (data) => {
                networkLogger.log(data);
                sigConnection.sendRawTo("offer_and_cand", dataToSend, data.from);
            }
        };
        const handlers = actionToHandler(null, actions);

        sigConnection.registerHandler(handlers);
        sigConnection.connect();
    });
    const gamePromise = Promise.withResolvers();
    connection.on("open", (openCon) => {
        removeElem(qr);
        const game = beginGame(window, document, settings, gameFunction, connection, openCon, myId);
        gamePromise.resolve(game);
    });

    showReadBtn(window, document, networkLogger).then(async (answerAndCand) => {
        networkLogger.log(answerAndCand);
        answerAndCandPromise.resolve(answerAndCand);
    });
    const answerAndCand = await answerAndCandPromise.promise;
    await connection.setAnswerAndCand(answerAndCand);
    networkLogger.log("after set", answerAndCand);
    return gamePromise.promise;
}

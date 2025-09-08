import connectionFunc from "../connection/server_webrtc.js";
import connectionFuncSig from "../connection/broadcast.js";

import netObj from "./net.js";
import {makeQrPlain} from "../views/qr_helper.js";
import {removeElem} from "../utils/helper.js";
import {delay} from "../utils/timer.js";
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

    const gameChannelPromise = createSignalingChannel(myId, window.location, settings, networkLogger);
    const offerPromise = connection.placeOfferAndWaitCandidates();
    const timer = delay(2000);
    await Promise.race([offerPromise, timer]);
    const dataToSend = connection.getOfferAndCands();
    dataToSend.id = myId;
    const currentUrl = new URL(window.location.href);
    const urlWithoutParams = currentUrl.origin + currentUrl.pathname;
    const baseUrl = urlWithoutParams || "https://asavan.github.io/sosgame/";
    const jsonString = JSON.stringify(dataToSend);
    const encoded2 = LZString.compressToEncodedURIComponent(jsonString);
    const url2 = baseUrl + "?c=" + encoded2;
    const qr = makeQrPlain(url2, document, ".qrcode");

    const answerAndCandPromise = Promise.withResolvers();
    let clientId = null;
    gameChannelPromise.then(chan => {
        const sigConnection = connectionFuncSig(myId, networkLogger, chan);

        const actions = {
            "offer_and_cand": (data) => {
                answerAndCandPromise.resolve(data);
                delay(2000).then(() => {
                    // TODO send only if not opened yet. Send not to all.
                    if (clientId != null) {
                        sigConnection.sendRawTo("stop_waiting", {}, clientId);
                    }
                });
                return Promise.resolve();
            }
        };
        const handlers = actionToHandler(actions);

        sigConnection.on("join", (data) => {
            networkLogger.log(data);
            if (clientId == null) {
                clientId = data.from;
            }
            if (clientId === data.from) {
                sigConnection.sendRawTo("offer_and_cand", dataToSend, clientId);
            }
            return Promise.resolve();
        });

        sigConnection.registerHandler(handlers);
        return sigConnection.connect();
    }).catch(err => {
        networkLogger.log(err);
    });
    const gamePromise = Promise.withResolvers();
    connection.on("open", (openCon) => {
        removeElem(qr);
        const game = beginGame(window, document, settings, gameFunction, connection, openCon, myId);
        gamePromise.resolve(game);
        return Promise.resolve();
    });

    showReadBtn(window, document, networkLogger).then((answerAndCand) => {
        networkLogger.log(answerAndCand);
        answerAndCandPromise.resolve(answerAndCand);
    }).catch(err => {
        networkLogger.error(err);
    });
    const answerAndCand = await answerAndCandPromise.promise;
    await connection.setAnswerAndCand(answerAndCand);
    networkLogger.log("after set", answerAndCand);
    return gamePromise.promise;
}

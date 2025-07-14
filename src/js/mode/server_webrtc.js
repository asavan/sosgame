import connectionFunc from "../connection/server_webrtc.js";
import netObj from "./net.js";
import {makeQrPlain} from "../views/qr_helper.js";
import {delay, removeElem} from "../utils/helper.js";
import scanBarcode from "../views/barcode.js";
import LZString from "lz-string";
import loggerFunc from "../views/logger.js";
import addSettingsButton from "../views/settings-form-btn.js";
import {beginGame} from "./server_helper.js";

function showReadBtn(document, logger) {
    const barCodeReady = Promise.withResolvers();
    const qrBtn = document.querySelector(".qr-btn");
    qrBtn.classList.remove("hidden");
    qrBtn.addEventListener("click", async () => {
        let codes = await scanBarcode(logger, document);
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

export default function gameMode(window, document, settings, gameFunction) {
    return new Promise((resolve, reject) => {
        const networkLogger = loggerFunc(document, settings);
        addSettingsButton(document, settings);
        const myId = netObj.getMyId(window, settings, Math.random);
        const connection = connectionFunc(myId, networkLogger);
        const mainSection = document.querySelector(".game");
        mainSection.classList.add("hidden");

        const offerPromice = connection.placeOfferAndWaitCandidates();
        const timer = delay(2000);
        Promise.race([offerPromice, timer]).then(() => {
            const dataToSend = connection.getOfferAndCands();
            const currentUrl = new URL(window.location.href);
            const urlWithoutParams = currentUrl.origin + currentUrl.pathname;
            const baseUrl = urlWithoutParams || "https://asavan.github.io/sosgame/";
            const jsonString = JSON.stringify(dataToSend);
            const encoded2 = LZString.compressToEncodedURIComponent(jsonString);
            const url2 = baseUrl + "?c=" + encoded2;
            const qr = makeQrPlain(url2, document, ".qrcode");

            showReadBtn(document, networkLogger).then(async (answerAndCand) => {
                networkLogger.log(answerAndCand);
                connection.on("open", (openCon) => {
                    removeElem(qr);
                    const game = beginGame(window, document, settings, gameFunction, connection, openCon, myId);
                    resolve(game);
                });
                await connection.setAnswerAndCand(answerAndCand);
                console.log("after set", answerAndCand);
            }).catch((e) => {
                reject(e);
            });
        }).catch(error => {
            networkLogger.error(error);
            reject(error);
        });
    });
}

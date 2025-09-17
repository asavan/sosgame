import netObj from "./net.js";
import {makeQrPlain} from "../views/qr_helper.js";
import {removeElem} from "../utils/helper.js";
import {delayReject} from "../utils/timer.js";
import scanBarcode from "../views/barcode.js";
import LZString from "lz-string";
import loggerFunc from "../views/logger.js";
import addSettingsButton from "../views/settings-form-btn.js";
import {beginGame} from "./server_helper.js";
import createSignalingChannel from "../connection/channel_with_name.js";
import {createDataChannel} from "../connection/webrtc_channel_server.js";
import connectionFunc from "../connection/broadcast.js";
import connectionFuncRtc from "../connection/server_webrtc.js";

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

function showQr(window, document, dataToSend) {
    const currentUrl = new URL(window.location.href);
    const urlWithoutParams = currentUrl.origin + currentUrl.pathname;
    const baseUrl = urlWithoutParams || "https://asavan.github.io/sosgame/";
    const jsonString = JSON.stringify(dataToSend);
    const encoded2 = LZString.compressToEncodedURIComponent(jsonString);
    const url2 = baseUrl + "?c=" + encoded2;
    const qr = makeQrPlain(url2, document, ".qrcode");
    console.log(qr);
    return qr;
}

export default async function gameMode(window, document, settings, gameFunction) {
    const networkLogger = loggerFunc(document, settings);
    addSettingsButton(document, settings);
    const myId = netObj.getMyId(window, settings, Math.random);
    const mainSection = document.querySelector(".game");
    mainSection.classList.add("hidden");

    const gameChannelPromise = createSignalingChannel(myId, window.location, settings, networkLogger);
    const sigChan = await Promise.race([gameChannelPromise, delayReject(5000)]).catch(() => null);
    const dataChan = createDataChannel(myId, networkLogger);
    const dataToSend = await dataChan.getDataToSend();
    const qr = showQr(window, document, dataToSend);
    let connection = null;
    showReadBtn(window, document, networkLogger).then((answerAndCand) => {
        networkLogger.log(answerAndCand);
        dataChan.resolveExternal(answerAndCand);
    }).catch(err => {
        networkLogger.error(err);
    });
    try {
        await dataChan.setupChan(dataToSend, sigChan);
        await dataChan.processAns();
        connection = connectionFuncRtc(myId, networkLogger);
        await dataChan.ready();
        // if (sigChan) {
        //     sigChan.close();
        // }
        connection.addChan(dataChan, dataChan.getOtherId());
    } catch (err) {
        networkLogger.error(err);
        connection = connectionFunc(myId, networkLogger, sigChan, "serverCon");
    }

    removeElem(qr);
    const game = beginGame(window, document, settings, gameFunction, connection, connection, myId);
    await connection.connect();
    return game;
}

import JSONCrush from "jsoncrush";

import {beginGame, makeQr} from "./server_helper.js";
import {
    addSettingsButton,
    createSignalingChannel, createDataChannelServer,
    broadcastConnectionFunc, delayReject,
    loggerFunc, rtcConnectionFunc,
    makeQrStr, netObj, removeElem, scanBarcode
} from "netutils";

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
        const decode = JSONCrush.uncrush(codes);
        barCodeReady.resolve(JSON.parse(decode));
    });

    return barCodeReady.promise;
}

function showQr(window, document, settings, dataToSend) {
    const baseUrl = netObj.getHostUrl(settings, window.location);
    const jsonString = JSON.stringify(dataToSend);
    const encoded3 = JSONCrush.crush(jsonString);
    const encoded4 = window.encodeURIComponent(encoded3);
    const url4 = baseUrl + "?z=" + encoded4;
    return makeQrStr(url4, window, document, settings);
}

export default async function gameMode(window, document, settings, gameFunction) {
    const mainLogger = loggerFunc(document, settings);
    addSettingsButton(document, settings);
    const myId = netObj.getMyId(window, settings, Math.random);
    const mainSection = document.querySelector(".game");
    mainSection.classList.add("hidden");

    const signalingLogger = loggerFunc(document, settings, 1);
    const gameChannelPromise = createSignalingChannel(myId, myId, window.location, settings, signalingLogger);
    const sigChan = await Promise.race([gameChannelPromise, delayReject(5000)]).catch(() => null);
    const dataChanLogger = loggerFunc(document, settings, 1);
    const connectionLogger = loggerFunc(document, settings, 1);
    const dataChan = createDataChannelServer(myId, dataChanLogger);
    const dataToSend = await dataChan.getDataToSend();
    const qr1 = showQr(window, document, settings, dataToSend);
    const qr2 = makeQr(window, document, settings, myId);
    let connection = null;
    showReadBtn(window, document, mainLogger).then((answerAndCand) => {
        mainLogger.log(answerAndCand);
        dataChan.resolveExternal(answerAndCand);
    }).catch(err => {
        mainLogger.error(err);
    });
    try {
        if (sigChan) {
            await dataChan.setupChan(sigChan);
        }
        await dataChan.processAns();
        connection = rtcConnectionFunc(myId, connectionLogger);
        await dataChan.ready();
        // if (sigChan) {
        //     sigChan.close();
        // }
        connection.addChan(dataChan, dataChan.getOtherId());
    } catch (err) {
        mainLogger.error(err);
        connection = broadcastConnectionFunc(myId, connectionLogger, sigChan);
    }

    removeElem(qr1);
    removeElem(qr2);
    const game = beginGame(window, document, settings, gameFunction, connection, connection, myId);
    await connection.connect();
    return game;
}

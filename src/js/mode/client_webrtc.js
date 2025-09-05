import connectionFunc from "../connection/broadcast.js";

import netObj from "./net.js";
import {makeQrPlain} from "../views/qr_helper.js";
import {delay} from "../utils/timer.js";

import LZString from "lz-string";
import {showGameView} from "../views/section_view.js";
import loggerFunc from "../views/logger.js";
import addSettingsButton from "../views/settings-form-btn.js";
import {beginGame} from "./client_helper.js";
import PromiseQueue from "../utils/async-queue.js";

import createSignalingChannel from "../connection/channel_with_name_client.js";
import {createDataChannel} from "../connection/webrtc_channel_client.js";

function showQr(document, dataToSend) {
    const jsonString = JSON.stringify(dataToSend);
    const encoded2 = LZString.compressToEncodedURIComponent(jsonString);
    const qr = makeQrPlain(encoded2, document, ".qrcode");
    console.log(qr);
}

export default async function gameMode(window, document, settings, gameFunction) {
    addSettingsButton(document, settings);
    const mainSection = document.querySelector(".game");
    mainSection.classList.add("hidden");
    const networkLogger = loggerFunc(document, settings);
    const myId = netObj.getMyId(window, settings, Math.random);
    const queue = PromiseQueue(networkLogger);
    const gameChannelPromise = createSignalingChannel(myId, window.location, settings, networkLogger);
    const sigChan = await Promise.race([gameChannelPromise, delay(5000)]).catch(() => null);
    const dataChan = createDataChannel(window, settings, myId, networkLogger, sigChan);
    const gamePromise = Promise.withResolvers();
    const dataToSendPromise = dataChan.connect();
    dataToSendPromise.then((dataToSend) => showQr(document, dataToSend)).catch((err) => {
        gamePromise.reject(err);
    });

    const connection = connectionFunc(myId, networkLogger, dataChan);

    connection.on("gameinit", (data) => {
        const game = beginGame(window, document, settings, gameFunction,
            networkLogger, connection, connection, data, queue);
        gamePromise.resolve(game);
    });

    await connection.connect();
    networkLogger.log("open");
    showGameView(document);
    connection.sendRawTo("join", {}, "all");
    networkLogger.log("after send");

    return gamePromise.promise;
}

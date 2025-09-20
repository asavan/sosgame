import netObj from "./net.js";
import {makeQrPlain} from "../views/qr_helper.js";
import {delayReject} from "../utils/timer.js";

import LZString from "lz-string";
import loggerFunc from "../views/logger.js";
import addSettingsButton from "../views/settings-form-btn.js";
import {beginGame} from "./client_helper.js";

import {assert} from "../utils/helper.js";

import {createSignalingChannel, createDataChannelClient, broadcastConnectionFunc} from "netutils";

function showQr(document, dataToSend, logger) {
    const jsonString = JSON.stringify(dataToSend);
    const encoded2 = LZString.compressToEncodedURIComponent(jsonString);
    const qr = makeQrPlain(encoded2, document, ".qrcode");
    logger.log(qr);
}

function clientOfferPromise(window, offerPromise) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const connectionStr = urlParams.get("c");
    if (!connectionStr) {
        return;
    }
    const offerAndCandidatesStr = LZString.decompressFromEncodedURIComponent(connectionStr);
    const offerAndCandidates = JSON.parse(offerAndCandidatesStr);
    offerPromise.resolve(offerAndCandidates);
}

export default async function gameMode(window, document, settings, gameFunction) {
    console.time("loadgame");
    addSettingsButton(document, settings);
    const mainSection = document.querySelector(".game");
    mainSection.classList.add("hidden");
    const mainLogger = loggerFunc(document, settings, 2, null, "mainLog");
    const myId = netObj.getMyId(window, settings, Math.random);
    const offerPromise = Promise.withResolvers();
    clientOfferPromise(window, offerPromise);
    const serverId = await Promise.race([offerPromise.promise, Promise.resolve(null)]).then(data => data?.id);
    mainLogger.log("maybe server " + serverId);
    const signalingLogger = loggerFunc(document, settings, 1);
    const gameChannelPromise = createSignalingChannel(myId, window.location, settings, signalingLogger, serverId);
    const sigChan = await Promise.race([gameChannelPromise, delayReject(5000)]).catch(() => null);
    console.timeLog("loadgame", "c0");
    const dataChanLogger = loggerFunc(document, settings, 1);
    const dataChan = createDataChannelClient(myId, dataChanLogger);
    let commChan = null;
    const qrLogger = loggerFunc(document, settings, 1);
    try {
        const dataToSend = await dataChan.connect(offerPromise, sigChan);
        commChan = dataChan;
        showQr(document, dataToSend, qrLogger);
        await dataChan.ready();
        if (sigChan) {
            sigChan.close();
        }
    } catch (err) {
        mainLogger.error(err);
        commChan = sigChan;
    }

    const connectionLogger = loggerFunc(document, settings, 1, null, "clientRtcBroadConn1");
    const connection = broadcastConnectionFunc(myId, connectionLogger, commChan);
    const gameInitPromise = Promise.withResolvers();
    connection.on("gameinit", (data) => {
        gameInitPromise.resolve(data);
    });

    connection.on("reconnect", (data) => {
        assert(data.data.serverId === data.from, `Different server ${data}`);
        window.location.reload();
    });

    const openCon = await connection.connect();
    openCon.sendRawAll("join", {});
    mainLogger.log("joined. Wait for gameinit");
    const gameInitData = await Promise.race([gameInitPromise.promise, delayReject(5000)]);
    const game = beginGame(window, document, settings, gameFunction,
        mainLogger, openCon, gameInitData.data);
    return game;
}

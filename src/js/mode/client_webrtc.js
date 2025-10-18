import netObj from "./net.js";

import LZString from "lz-string";
import {beginGame} from "./client_helper.js";

import {
    assert,
    addSettingsButton, createSignalingChannel,
    createDataChannelClient, broadcastConnectionFunc,
    delayReject, loggerFunc, makeQrStr
} from "netutils";

function showQr(window, document, settings, dataToSend, logger) {
    const jsonString = JSON.stringify(dataToSend);
    const encoded2 = LZString.compressToEncodedURIComponent(jsonString);
    const qr = makeQrStr(encoded2, window, document, settings);
    logger.log(qr);
    return qr;
}

function clientOfferPromise(window, offerPromise) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const connectionStr = urlParams.get("z");
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
    const gameChannelPromise = createSignalingChannel(myId, serverId, window.location, settings, signalingLogger);
    const sigChan = await Promise.race([gameChannelPromise, delayReject(5000)]).catch(() => null);
    console.timeLog("loadgame", "c0");
    const dataChanLogger = loggerFunc(document, settings, 1);
    const dataChan = createDataChannelClient(myId, dataChanLogger);
    let commChan = null;
    const qrLogger = loggerFunc(document, settings, 1);
    try {
        const dataToSend = await dataChan.connect(offerPromise, sigChan);
        commChan = dataChan;
        showQr(window, document, settings, dataToSend, qrLogger);
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

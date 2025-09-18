import connectionFunc from "../connection/broadcast.js";

import netObj from "./net.js";
import {makeQrPlain} from "../views/qr_helper.js";
import {delayReject} from "../utils/timer.js";

import LZString from "lz-string";
import {showGameView} from "../views/section_view.js";
import loggerFunc from "../views/logger.js";
import addSettingsButton from "../views/settings-form-btn.js";
import {beginGame} from "./client_helper.js";

import createSignalingChannel from "../connection/channel_with_name_client.js";
import {createDataChannel} from "../connection/webrtc_channel_client.js";
import {assert} from "../utils/helper.js";

function showQr(document, dataToSend) {
    const jsonString = JSON.stringify(dataToSend);
    const encoded2 = LZString.compressToEncodedURIComponent(jsonString);
    const qr = makeQrPlain(encoded2, document, ".qrcode");
    console.log(qr);
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
    addSettingsButton(document, settings);
    const mainSection = document.querySelector(".game");
    mainSection.classList.add("hidden");
    const mainLogger = loggerFunc(document, settings);
    const myId = netObj.getMyId(window, settings, Math.random);
    const offerPromise = Promise.withResolvers();
    clientOfferPromise(window, offerPromise);
    const serverId = await Promise.race([offerPromise.promise, Promise.resolve(null)]).then(data => data?.id);
    mainLogger.log("maybe server " + serverId);
    const signalingLogger = loggerFunc(document, settings, 1);
    const gameChannelPromise = createSignalingChannel(myId, window.location, settings, signalingLogger, serverId);
    const sigChan = await Promise.race([gameChannelPromise, delayReject(5000)]).catch(() => null);
    const dataChanLogger = loggerFunc(document, settings, 1);
    const dataChan = createDataChannel(myId, dataChanLogger);
    let commChan = null;
    const gamePromise = Promise.withResolvers();
    try {
        const dataToSend = await dataChan.connect(offerPromise, sigChan);
        commChan = dataChan;
        showQr(document, dataToSend);
        await dataChan.ready();
        if (sigChan) {
            sigChan.close();
        }
    } catch (err) {
        mainLogger.error(err);
        commChan = sigChan;
    }

    const connection = connectionFunc(myId, mainLogger, commChan, "clientRtcBroadConn");
    const openConPromise = Promise.withResolvers();
    connection.on("gameinit", async (data) => {
        const openCon = await openConPromise.promise;
        const game = beginGame(window, document, settings, gameFunction,
            mainLogger, openCon, data.data);
        gamePromise.resolve(game);
    });

    connection.on("reconnect", (data) => {
        assert(data.data.serverId === data.from, `Different server ${data}`);
        // const openCon = await openConPromise.promise;
        window.location.reload();
        // openCon.sendRawTo("join", {}, data.data.serverId);
        // TODO
    });

    const runAsync = async () => {
        const openCon = await connection.connect();
        openConPromise.resolve(openCon);
        showGameView(document);
        openCon.sendRawAll("join", {});
        mainLogger.log("after send");
        return delayReject(5000);
    };
    runAsync().catch((err) => {
        gamePromise.reject(err);
    });
    return gamePromise.promise;
}

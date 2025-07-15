import PromiseQueue from "../utils/async-queue.js";

import connectionFunc from "../connection/broadcast.js";
import netObj from "./net.js";
import {removeElem} from "../utils/helper.js";
import {makeQrPlain} from "../views/qr_helper.js";
import {networkHandler} from "../connection/network_handler.js";
import {beginGame} from "./server_helper.js";
import createSignalingChannel from "../connection/common.js";

function makeQr(window, document, settings) {
    const staticHost = settings.sh || window.location.href;
    const url = new URL(staticHost);
    url.searchParams.set("mode", "client");
    console.log("enemy url", url.toString());
    return makeQrPlain(url.toString(), document, ".qrcode");
}

export default async function gameMode(window, document, settings, gameFunction) {
    const myId = netObj.getMyId(window, settings, Math.random);
    const networkLogger = netObj.setupLogger(document, settings);

    const code = makeQr(window, document, settings);
    const gameChannel = createSignalingChannel(myId, netObj.getWebSocketUrl(settings, window.location), networkLogger);

    await gameChannel.ready();
    const queue = PromiseQueue(networkLogger);
    const networkActions = networkHandler({}, queue, networkLogger);
    const connection = connectionFunc(myId, networkLogger, networkActions, gameChannel);
    const game = beginGame(window, document, settings, gameFunction, connection, connection, myId);
    game.on("started", () => {
        removeElem(code);
    });
    await connection.connect();
    return game;
}

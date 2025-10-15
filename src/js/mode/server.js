import netObj from "./net.js";
import {makeQrPlain, removeElem} from "../views/qr_helper.js";
import {beginGame} from "./server_helper.js";
import loggerFunc from "../views/logger.js";

import {createSignalingChannel, broadcastConnectionFunc} from "netutils";
import addSettingsButton from "../views/settings-form-btn.js";

function makeQr(window, document, settings, mode) {
    const staticHost = settings.sh || window.location.href;
    const url = new URL(staticHost);
    url.searchParams.set("mode", mode);
    console.log("enemy url", url.toString());
    return makeQrPlain(url.toString(), document, ".qrcode");
}

export default async function gameMode(window, document, settings, gameFunction) {
    addSettingsButton(document, settings);
    const myId = netObj.getMyId(window, settings, Math.random);
    const networkLogger = loggerFunc(document, settings);

    const gameChannel = await createSignalingChannel(myId, window.location, settings, networkLogger);
    const code = makeQr(window, document, settings, gameChannel.clientModeName());

    const connection = broadcastConnectionFunc(myId, networkLogger, gameChannel);
    const game = beginGame(window, document, settings, gameFunction, connection, connection, myId);
    game.on("started", () => {
        removeElem(code);
    });
    await connection.connect();
    return game;
}

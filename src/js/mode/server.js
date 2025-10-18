import netObj from "./net.js";
import {removeElem} from "../views/qr_helper.js";
import {beginGame} from "./server_helper.js";

import {
    addSettingsButton, createSignalingChannel,
    broadcastConnectionFunc, loggerFunc, makeQrStr
} from "netutils";

function makeQr(window, document, settings) {
    const staticHost = netObj.getHostUrl(settings, window.location);
    const url = new URL(staticHost);
    console.log("enemy url", url.toString());
    const image = {
        source: "./images/sos.png",
        width: "10%",
        height: "20%",
        x: "center",
        y: "center"
    };
    return makeQrStr(url.toString(), window, document, settings, image);
}

export default async function gameMode(window, document, settings, gameFunction) {
    addSettingsButton(document, settings);
    const myId = netObj.getMyId(window, settings, Math.random);
    const networkLogger = loggerFunc(document, settings);

    const gameChannel = await createSignalingChannel(myId, myId, window.location, settings, networkLogger);
    const code = makeQr(window, document, settings);

    const connection = broadcastConnectionFunc(myId, networkLogger, gameChannel);
    const game = beginGame(window, document, settings, gameFunction, connection, connection, myId);
    game.on("started", () => {
        removeElem(code);
    });
    await connection.connect();
    return game;
}

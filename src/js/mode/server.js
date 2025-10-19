import {beginGame, makeQr} from "./server_helper.js";

import {
    addSettingsButton, createSignalingChannel,
    broadcastConnectionFunc, loggerFunc,
    netObj, removeElem
} from "netutils";

export default async function gameMode(window, document, settings, gameFunction) {
    addSettingsButton(document, settings);
    const myId = netObj.getMyId(window, settings, Math.random);
    settings.serverId = myId;
    const networkLogger = loggerFunc(document, settings);

    const gameChannel = await createSignalingChannel(myId, myId, window.location, settings, networkLogger);
    const code = makeQr(window, document, settings, myId);

    const connection = broadcastConnectionFunc(myId, networkLogger, gameChannel);
    const game = beginGame(window, document, settings, gameFunction, connection, connection, myId);
    game.on("started", () => {
        removeElem(code);
    });
    await connection.connect();
    return game;
}

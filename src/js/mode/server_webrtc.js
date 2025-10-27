import {beginGame, makeQr} from "./server_helper.js";
import {
    addSettingsButton,
    broadcastConnectionFunc,
    loggerFunc, server_chan,
    netObj, removeElem
} from "netutils";

export default async function gameMode(window, document, settings, gameFunction) {
    const connectionLogger = loggerFunc(document, settings, 1);
    addSettingsButton(document, settings);
    const myId = netObj.getMyId(window, settings, Math.random);
    const mainSection = document.querySelector(".game");
    mainSection.classList.add("hidden");
    const qr2 = makeQr(window, document, settings, myId);
    const commChan = await server_chan(myId, window, document, settings);
    removeElem(qr2);
    const connection = broadcastConnectionFunc(myId, connectionLogger, commChan);
    const game = beginGame(window, document, settings, gameFunction, connection, connection, myId);
    await connection.connect();
    return game;
}

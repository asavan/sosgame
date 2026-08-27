import {beginGame, gameInitClient} from "./client_helper.js";

import {
    addFullScreenBtn, client_chan,
    loggerFunc, netObj, showGameView
} from "netutils";

export default async function gameMode(window, document, settings, gameFunction) {
    const mainSection = document.querySelector(".game");
    mainSection.classList.add("hidden");
    const mainLogger = loggerFunc(document, settings, 2, null, "mainLog");
    const myId = netObj.getMyId(window, settings, Math.random);
    const commChan = await client_chan(myId, window, document, settings);
    const gameInitData = await gameInitClient(document, settings, myId, commChan, window, mainLogger);
    const game = beginGame(window, document, settings, gameFunction,
        mainLogger, commChan, gameInitData.data, myId);
    showGameView(document);
    addFullScreenBtn(window, document);
    return game;
}

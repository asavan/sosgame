import presenterObj from "../presenter.js";
import {loggerFunc, netObj} from "netutils";
import {fromSender, jsonSocketChan, netHandler, wrapJsonNetworkToNegotiator} from "./test_helper.js";

export default async function test(window, document, settings, gameFunction) {
    const presenter = presenterObj.presenterFuncDefault(settings);
    const game = gameFunction(window, document, settings, presenter);
    const mainLogger = loggerFunc(document, settings, 2, null, "mainLog");
    const logger = loggerFunc(document, settings, 2, null, "socketLogger");
    const myId = netObj.getMyId(window, settings, Math.random);
    const socketUrl = netObj.getWebSocketUrl(settings, location);
    mainLogger.log("Started " + myId);
    mainLogger.log("Socket " + socketUrl);
    const jsonChan = jsonSocketChan(socketUrl, logger);
    const idChan = fromSender(myId, jsonChan);
    const neg1 = wrapJsonNetworkToNegotiator(idChan, logger, myId);
    const negNet = netHandler(logger, neg1);
    await jsonChan.ready();
    negNet.send({"join": myId});
    logger.log("send join " + myId);

    game.on("gameover", () => {
        const btnAdd = document.querySelector(".butInstall");
        btnAdd.classList.remove("hidden2");
    });

    presenter.resetRound();
    game.redraw();
    return Promise.resolve(game);
}

import presenterObj from "../presenter.js";
import {loggerFunc, netObj, addLoggerBtn, addFullScreenBtn} from "netutils";
import {fromSender, netHandler, wrapJsonNetworkToNegotiator} from "./test_helper.js";
import {qrHandler} from "../views/manual-qr.js";
import {piSocket} from "../conection/pisocket.js";

export default async function test(window, document, settings, gameFunction) {
    addFullScreenBtn(window, document);
    addLoggerBtn(window, document);
    qrHandler(window, document);
    const presenter = presenterObj.presenterFuncDefault(settings);
    const game = gameFunction(window, document, settings, presenter);
    const mainLogger = loggerFunc(document, settings, 2, null, "mainLog");
    const logger = loggerFunc(document, settings, 2, null, "socketLogger");
    const myId = netObj.getMyId(window, settings, Math.random);
    const socketUrl = netObj.getWebSocketUrl(settings, location);
    mainLogger.log("Started " + myId);
    mainLogger.log("Socket " + socketUrl);
    const jsonChan = piSocket(logger);
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

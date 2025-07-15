import presenterObj from "../presenter.js";
import actionsFunc from "../actions.js";
import netObj from "./net.js";
import {showGameView} from "../views/section_view.js";

export function beginGame(window, document, settings, gameFunction, logger, connection, con, data) {
    logger.log("gameinit", data);
    showGameView(document);
    const presenter = presenterObj.presenterFunc(data.data.presenter, settings);
    const game = gameFunction(window, document, settings, presenter);
    const actions = actionsFunc(game);
    connection.registerHandler(actions);
    netObj.setupGameToConnectionSendClient(game, con, logger, data.data);
}

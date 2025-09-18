import presenterObj from "../presenter.js";
import actionsFunc from "../actions.js";
import {showGameView} from "../views/section_view.js";
import actionToHandler from "../utils/action_to_handler.js";
import {wrapClientConnection} from "../connection/client_wrap_connection.js";

function setupGameToConnectionSendClient(game, con, logger, actionKeys) {
    for (const handlerName of actionKeys) {
        game.on(handlerName, (n) => {
            if (!n || (n.playerId !== null && n.playerId !== n.clientId)) {
                logger.log("ignore", n);
                return;
            }
            con.sendRawClient(handlerName, n);
        });
    }
}

export function beginGame(window, document, settings, gameFunction, logger, openCon, data) {
    logger.log("Start game", data);
    showGameView(document);
    const presenter = presenterObj.presenterFunc(data.presenter, settings);
    const game = gameFunction(window, document, settings, presenter);
    const actions = actionsFunc(game);
    const gameHandler = actionToHandler(actions);
    openCon.registerHandler(gameHandler);
    const wrapConnecton = wrapClientConnection(openCon, data.serverId);
    setupGameToConnectionSendClient(game, wrapConnecton, logger, Object.keys(actions));

    if (settings.fastRestart) {
        game.on("winclosed", () => {
            presenter.nextRound();
            game.redraw();
        });
    }
    return game;
}

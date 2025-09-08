import lobbyFunc from "../lobby.js";
import loggerFunc from "../views/logger.js";
import PromiseQueue from "../utils/async-queue.js";
import actionsFunc from "../actions.js";
import {showGameView} from "../views/section_view.js";
import presenterObj from "../presenter.js";
import actionToHandler from "../utils/action_to_handler.js";

function reconnect(con, serverId) {
    const toSend = {
        serverId: serverId,
    };
    return con.sendRawAll("reconnect", toSend);
}

function setupGameToConnectionSend(game, con, lobby, logger) {
    for (const handlerName of game.actionKeys()) {
        logger.log("register", handlerName);
        game.on(handlerName, (n) => {
            let ignore;
            if (n && n.playerId !== undefined) {
                const toIgnore = lobby.idByInd(n.playerId);
                ignore = [toIgnore];
            }
            logger.log("call", handlerName);
            try {
                con.sendRawAll(handlerName, n, ignore);
            } catch (e) {
                logger.error(e);
            }
            logger.log("after call", handlerName);
        });
    }
    // return Promise.resolve();
    // return reconnect(con, serverId);
}

export function connectNetworkAndGame(document, game, presenter, myId, settings, con, connection) {
    const lobby = lobbyFunc({}, presenter.getClientIndex());
    lobby.addClient(myId, myId);

    const gameLogger = loggerFunc(document, settings);
    const connectionLogger = loggerFunc(document, settings, 1);
    const queue = PromiseQueue(gameLogger);

    game.on("winclosed", () => {
        presenter.nextRound();
        game.redraw();
        return reconnect(connection, myId);
    });

    connection.on("join", (data) => {
        connectionLogger.log("join", data);
        lobby.addClient(data.from, data.from);
        const joinedInd = lobby.indById(data.from);
        const serverInd = lobby.indById(myId);
        if (lobby.size() === settings.playerLimit && presenter.isGameOver()) {
            presenter.resetRound();
            showGameView(document);
        }

        const presenterObj = presenter.toJson(joinedInd);
        const toSend = {
            serverId: myId,
            joinedInd,
            serverInd,
            presenter: presenterObj
        };
        con.sendRawTo("gameinit", toSend, data.from);
        return game.redraw();
    });

    const actions = actionsFunc(game);
    const gameHandler = actionToHandler(queue, actions);
    connection.registerHandler(gameHandler);
    setupGameToConnectionSend(game, connection, lobby, connectionLogger);
}

export function beginGame(window, document, settings, gameFunction, connection, openCon, myId) {
    const presenter = presenterObj.presenterFuncDefault(settings);
    const game = gameFunction(window, document, settings, presenter);
    connectNetworkAndGame(document, game, presenter, myId, settings, openCon, connection);
    return game;
}

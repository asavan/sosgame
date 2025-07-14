import PromiseQueue from "../utils/async-queue.js";

import actionsFunc from "../actions.js";
import connectionFunc from "../connection/socket.js";
import lobbyFunc from "../lobby.js";
import netObj from "./net.js";
import presenterObj from "../presenter.js";
import {removeElem} from "../utils/helper.js";
import {makeQrPlain} from "../views/qr_helper.js";
import {networkHandler} from "../connection/network_handler.js";


function makeQr(window, document, settings) {
    const staticHost = settings.sh || window.location.href;
    const url = new URL(staticHost);
    url.searchParams.set("mode", "client");
    console.log("enemy url", url.toString());
    return makeQrPlain(url.toString(), document, ".qrcode");
}

function reconnect(con, serverId) {
    const toSend = {
        serverId: serverId,
    };
    return con.sendRawAll("reconnect", toSend);
}

function setupGameToConnectionSend(game, con, serverId, lobby) {
    for (const handlerName of game.actionKeys()) {
        game.on(handlerName, (n) => {
            let ignore;
            if (n && n.playerId !== undefined) {
                const toIgnore = lobby.idByInd(n.playerId);
                ignore = [toIgnore];
            }
            con.sendRawAll(handlerName, n, ignore);
        });
    }
    return Promise.resolve();
    // return reconnect(con, serverId);
}

function setupNetwork(game, connection, con, serverId, lobby) {
    const actions = actionsFunc(game);
    connection.registerHandler(actions);
    return setupGameToConnectionSend(game, con, serverId, lobby);
}

export default function gameMode(window, document, settings, gameFunction) {

    return new Promise((resolve, reject) => {
        const myId = netObj.getMyId(window, settings, Math.random);
        const networkLogger = netObj.setupLogger(document, settings);
        const queue = PromiseQueue(networkLogger);
        const networkActions = networkHandler({}, queue, networkLogger);
        const connection = connectionFunc(myId, networkLogger, networkActions);
        const presenter = presenterObj.presenterFuncDefault(settings);
        const game = gameFunction(window, document, settings, presenter);

        const lobby = lobbyFunc({}, presenter.getClientIndex());
        lobby.addClient(myId, myId);

        connection.connect(connection.getWebSocketUrl(settings, window.location)).then(con => {
            const code = makeQr(window, document, settings);
            game.on("started", () => {
                removeElem(code);
            });
            game.on("winclosed", () => {
                presenter.nextRound();
                game.redraw();
                return reconnect(con, myId);
            });

            connection.on("join", (data) => {
                lobby.addClient(data.from, data.from);
                const joinedInd = lobby.indById(data.from);
                const serverInd = lobby.indById(myId);
                if (lobby.size() === settings.playerLimit && presenter.isGameOver()) {
                    presenter.resetRound();
                }

                const presenterObj = presenter.toJson(joinedInd);
                const toSend = {
                    serverId: myId,
                    joinedInd,
                    serverInd,
                    presenter: presenterObj
                };
                con.sendRawTo("gameinit", toSend, data.from);
                game.redraw();
                removeElem(code);
            });
            setupNetwork(game, connection, con, myId, lobby);
            resolve(game);
        }).catch(error => {
            networkLogger.error(error);
            reject(error);
        });

    });
}

import PromiseQueue from "../utils/async-queue.js";

import actionsFunc from "../actions.js";
import {assert} from "../utils/helper.js";
import connectionFunc from "../connection/socket.js";
import netObj from "./net.js";
import presenterObj from "../presenter.js";


function setupGameToConnectionSend(game, con, logger, data) {
    for (const handlerName of game.actionKeys()) {
        game.on(handlerName, (n) => {
            if (!n || (n.playerId !== null && n.playerId !== data.joinedInd)) {
                logger.log("ignore");
                return;
            }
            con.sendRawTo(handlerName, n, data.serverId);
        });
    }
}

export default function gameMode(window, document, settings, gameFunction) {

    return new Promise((resolve, reject) => {
        const myId = netObj.getMyId(window, settings, Math.random);
        const networkLogger = netObj.setupLogger(document, settings);
        const connection = connectionFunc(myId, networkLogger);
        const queue = PromiseQueue(networkLogger);

        connection.connect(connection.getWebSocketUrl(settings, window.location)).then(con => {
            networkLogger.log("connected");
            connection.on("gameinit", (data) => {
                console.log("gameinit", data);
                const presenter = presenterObj.presenterFunc(data.data.presenter, settings);
                const game = gameFunction(window, document, settings, presenter);
                const actions = actionsFunc(game);
                connection.registerHandler(actions, queue);
                setupGameToConnectionSend(game, con, networkLogger, data.data);
                resolve(game);
            });

            connection.on("reconnect", (data) => {
                assert(data.data.serverId === data.from, `Different server ${data}`);
                window.location.reload();
                // con.sendRawTo("join", {}, data.data.serverId);
            });

            con.sendRawAll("join");

        }).catch(error => {
            networkLogger.error(error);
            reject(error);
        });
    });
}

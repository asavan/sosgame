import netObj from "./net.js";
import connectionFunc from "../connection/socket.js";
import presenterObj from "../presenter.js";
import actionsFunc from "../actions.js";
import PromiseQueue from "../utils/async-queue.js";
import {assert} from "../utils/helper.js";


function setupGameToConnectionSend(game, con, logger, serverId) {
    for (const handlerName of game.actionKeys()) {
        game.on(handlerName, (n) => {
            if (n && n.ignore && Array.isArray(n.ignore)) {
                if (n.ignore.includes(serverId)) {
                    logger.log("ignore");
                    return;
                }
            }
            con.sendRawTo(handlerName, n, serverId);
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
                networkLogger.log("gameinit", data);
                const serverId = data.data.serverId;
                const presenter = presenterObj.presenterFunc(data.data.presenter, settings);
                const game = gameFunction(window, document, settings, presenter);
                const actions = actionsFunc(game);
                connection.registerHandler(actions, queue);
                setupGameToConnectionSend(game, con, networkLogger, serverId);
                resolve(game);
            });

            connection.on("reconnect", (data) => {
                assert(data.data.serverId === data.from, `Different server ${data}`);
                window.location.reload();
                // con.sendRawTo("join", {}, data.data.serverId);
            });

            con.sendRawAll("join");
            
        }).catch(e => {
            networkLogger.error(e);
            reject(e);
        });
    });
}

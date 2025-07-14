import PromiseQueue from "../utils/async-queue.js";

import {assert} from "../utils/helper.js";
import connectionFunc from "../connection/socket.js";
import netObj from "./net.js";
import {networkHandler} from "../connection/network_handler.js";
import {beginGame} from "./client_helper.js";

export default function gameMode(window, document, settings, gameFunction) {

    return new Promise((resolve, reject) => {
        const myId = netObj.getMyId(window, settings, Math.random);
        const networkLogger = netObj.setupLogger(document, settings);
        const queue = PromiseQueue(networkLogger);
        const networkActions = networkHandler({}, queue, networkLogger);
        const connection = connectionFunc(myId, networkLogger, networkActions);

        connection.connect(connection.getWebSocketUrl(settings, window.location)).then(con => {
            networkLogger.log("connected");
            connection.on("gameinit", (data) => {
                const game = beginGame(window, document, settings, gameFunction,
                    networkLogger, connection, con, data);
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

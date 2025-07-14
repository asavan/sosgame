import PromiseQueue from "../utils/async-queue.js";

import actionsFunc from "../actions.js";
import {assert} from "../utils/helper.js";
import connectionFunc from "../connection/socket.js";
import netObj from "./net.js";
import presenterObj from "../presenter.js";
import {networkHandler} from "../connection/network_handler.js";


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
                networkLogger.log("gameinit", data);
                const presenter = presenterObj.presenterFunc(data.data.presenter, settings);
                const game = gameFunction(window, document, settings, presenter);
                const actions = actionsFunc(game);
                connection.registerHandler(actions);
                netObj.setupGameToConnectionSendClient(game, con, networkLogger, data.data);
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

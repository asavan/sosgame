import PromiseQueue from "../utils/async-queue.js";

import {assert} from "../utils/helper.js";
import connectionFunc from "../connection/broadcast.js";
import netObj from "./net.js";
import {networkHandler} from "../connection/network_handler.js";
import {beginGame} from "./client_helper.js";
import loggerFunc from "../views/logger.js";
import createSignalingChannel from "../connection/websocket_channel.js";

export default async function gameMode(window, document, settings, gameFunction) {

    const myId = netObj.getMyId(window, settings, Math.random);
    const networkLogger = loggerFunc(document, settings);
    const queue = PromiseQueue(networkLogger);
    const networkActions = networkHandler({}, queue, networkLogger);
    const gameChannel = createSignalingChannel(myId, netObj.getWebSocketUrl(settings, window.location), networkLogger);
    const connection = connectionFunc(myId, networkLogger, networkActions, gameChannel);
    const gamePromise = Promise.withResolvers();

    connection.on("gameinit", (data) => {
        const game = beginGame(window, document, settings, gameFunction,
            networkLogger, connection, connection, data);
        gamePromise.resolve(game);
    });

    connection.on("reconnect", (data) => {
        assert(data.data.serverId === data.from, `Different server ${data}`);
        window.location.reload();
        // con.sendRawTo("join", {}, data.data.serverId);
    });

    await connection.connect();
    networkLogger.log("connected");
    connection.sendRawAll("join");
    return gamePromise.promise;
}

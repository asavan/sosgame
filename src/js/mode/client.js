"use strict";

import netObj from "./net.js";
import connectionFunc from "../connection/socket.js";
import presenterObj from "../presenter.js";

export default function gameMode(window, document, settings, gameFunction) {

    return new Promise((resolve, reject) => {
        const myId = netObj.getMyId(window, settings, Math.random);
        const networkLogger = netObj.setupLogger(document, settings);
        const connection = connectionFunc(myId, networkLogger);

        const queue = netObj.runLoop(window);
        connection.connect(connection.getWebSocketUrl(settings, window.location)).then(con => {
            networkLogger.log("connected");
            connection.on("gameinit", (data) => {
                console.log("gameinit", data);
                const serverId = data.data.serverId;
                const presenter = presenterObj.presenterFunc(data.data.presenter, settings);
                const game = gameFunction(window, document, settings, presenter);
                netObj.setupGame(game, connection, queue);
                for (const handlerName of game.actionKeys()) {
                    game.on(handlerName, (n) => {
                        if (n.ignore && Array.isArray(n.ignore)) {
                            if (n.ignore.includes(serverId)) {
                                networkLogger.log("ignore");
                                return;
                            }
                        }
                        con.sendTo(netObj.toObjJson(n, handlerName), serverId);
                    });
                }
                resolve(game);
            });
            con.join();
        }).catch(e => {
            networkLogger.error(e);
            reject(e);
        });
    });
}

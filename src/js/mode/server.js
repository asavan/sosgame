"use strict";

import {removeElem} from "../utils/helper.js";
import qrRender from "../lib/qrcode.js";
import connectionFunc from "../connection/socket.js";
import presenterObj from "../presenter.js";
import lobbyFunc from "../lobby.js";
import netObj from "./net.js";

function makeQr(window, document, settings) {
    const staticHost = settings.sh || window.location.href;
    const url = new URL(staticHost);
    console.log("enemy url", url.toString());
    return qrRender(url.toString(), document.querySelector(".qrcode"));
}


export default function gameMode(window, document, settings, gameFunction) {

    return new Promise((resolve, reject) => {
        const myId = netObj.getMyId(window, settings, Math.random);
        const networkLogger = netObj.setupLogger(document, settings);
        const connection = connectionFunc(myId, networkLogger);
        const queue = netObj.runLoop(window);
        const lobby = lobbyFunc();
        lobby.addClient(myId, myId);
        const presenter = presenterObj.presenterFuncDefault(settings);
        const game = gameFunction(window, document, settings, presenter);

        connection.connect(connection.getWebSocketUrl(settings, window.location)).then(con => {
            const code = makeQr(window, document, settings);
            game.on("started", () => {removeElem(code);});

            connection.on("join", (data) => {
                lobby.addClient(data.from, data.from);
                const joinedInd = lobby.indById(data.from);
                const presenterObj = game.makePresenter(joinedInd);
                const toSend = {
                    serverId: myId,
                    presenter: presenterObj
                };
                con.init(toSend, data.from);
            });
            netObj.setupGame(game, connection, queue);
            for (const handlerName of game.actionKeys()) {
                game.on(handlerName, (n) => {
                    let toSend = n;
                    let ignore = null;
                    if (n.ignore && Array.isArray(n.ignore)) {
                        toSend = n.data;
                        ignore = n.ignore;
                    }
                    con.sendAll(netObj.toObjJson(toSend, handlerName), ignore);
                });
            }
            resolve(game);
        }).catch(e => {
            networkLogger.error(e);
            reject(e);
        });

    });
}

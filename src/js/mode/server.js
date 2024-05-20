import {removeElem} from "../utils/helper.js";
import qrRender from "../lib/qrcode.js";
import connectionFunc from "../connection/socket.js";
import presenterObj from "../presenter.js";
import lobbyFunc from "../lobby.js";
import netObj from "./net.js";
import actionsFunc from "../actions.js";
import PromiseQueue from "../utils/async-queue.js";

function makeQr(window, document, settings) {
    const staticHost = settings.sh || window.location.href;
    const url = new URL(staticHost);
    url.searchParams.set("mode", "client");
    console.log("enemy url", url.toString());
    return qrRender(url.toString(), document.querySelector(".qrcode"));
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
            let ignore = null;
            if (n && n.playerId !== null) {
                const toIgnore = lobby.idByInd(n.playerId);
                ignore = [toIgnore];
            }
            con.sendRawAll(handlerName, n, ignore);
        });
    }
    return reconnect(con, serverId);
}

function setupNetwork(game, connection, con, serverId, queue, lobby) {
    const actions = actionsFunc(game);
    connection.registerHandler(actions, queue);
    return setupGameToConnectionSend(game, con, serverId, lobby);
}

export default function gameMode(window, document, settings, gameFunction) {

    return new Promise((resolve, reject) => {
        const myId = netObj.getMyId(window, settings, Math.random);
        const networkLogger = netObj.setupLogger(document, settings);
        const connection = connectionFunc(myId, networkLogger);
        const queue = PromiseQueue(networkLogger);
        const lobby = lobbyFunc({});
        lobby.addClient(myId, myId);
        const presenter = presenterObj.presenterFuncDefault(settings);
        const game = gameFunction(window, document, settings, presenter);

        connection.connect(connection.getWebSocketUrl(settings, window.location)).then(con => {
            const code = makeQr(window, document, settings);
            game.on("started", () => {removeElem(code);});
            game.on("winclosed", () => {
                presenter.nextRound();
                game.redraw();
                return reconnect(con, myId);
            });

            connection.on("join", (data) => {
                lobby.addClient(data.from, data.from);
                const joinedInd = lobby.indById(data.from);
                const serverInd = lobby.indById(myId);
                const presenterObj = presenter.toJson(joinedInd);
                const toSend = {
                    serverId: myId,
                    joinedInd,
                    serverInd, 
                    presenter: presenterObj
                };
                con.sendRawTo("gameinit", toSend, data.from);
            });
            setupNetwork(game, connection, con, myId, queue, lobby);
            resolve(game);
        }).catch(e => {
            networkLogger.error(e);
            reject(e);
        });

    });
}

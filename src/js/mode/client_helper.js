import presenterObj from "../presenter.js";
import actionsFunc from "../actions.js";
import {showGameView} from "../views/section_view.js";
import {
    subscribe_both_ways, assert,
    loggerFunc,
    broadcastConnectionFunc,
    delayReject
} from "netutils";


const filter = (n) => !(!n || (n.playerId !== null && n.playerId !== n.clientId));

export async function gameInitClient(document, settings, myId, commChan, window, mainLogger) {
    const connectionLogger = loggerFunc(document, settings, 1, null, "clientRtcBroadConn1");
    const connection = broadcastConnectionFunc(myId, connectionLogger, commChan);
    const gameInitPromise = Promise.withResolvers();
    connection.on("gameinit", (data) => {
        gameInitPromise.resolve(data);
    });

    connection.on("reconnect", (data) => {
        assert(data.data.serverId === data.from, `Different server ${data}`);
        const url = new URL(window.location.href);
        url.searchParams.delete("z");
        url.searchParams.set("serverId", data.data.serverId);
        // history.pushState({}, document.title, url.href);
        // window.location.reload();
        window.location.replace(url.toString());
    });

    const openCon = await connection.connect();
    openCon.sendRawAll("join", {});
    mainLogger.log("joined. Wait for gameinit");
    const gameInitData = await Promise.race([gameInitPromise.promise, delayReject(5000)]);
    return gameInitData;
}


export function beginGame(window, document, settings, gameFunction, logger, chan, data, myId) {
    logger.log("Start game", data);
    showGameView(document);
    const presenter = presenterObj.presenterFunc(data.presenter, settings);
    const game = gameFunction(window, document, settings, presenter);
    const actions = actionsFunc(game);
    subscribe_both_ways(game, Object.keys(actions), chan, actions, logger, true, myId, data.serverId, filter);
    if (settings.fastRestart) {
        game.on("winclosed", () => {
            presenter.nextRound();
            game.redraw();
        });
    }
    return game;
}

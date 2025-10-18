import {assert, delayReject, createSignalingChannel, broadcastConnectionFunc, loggerFunc, netObj} from "netutils";
import {beginGame} from "./client_helper.js";

export default async function gameMode(window, document, settings, gameFunction) {

    const myId = netObj.getMyId(window, settings, Math.random);
    const networkLogger = loggerFunc(document, settings);
    const gameChannel = await createSignalingChannel(myId, null, window.location, settings, networkLogger);
    const connection = broadcastConnectionFunc(myId, networkLogger, gameChannel);

    const gameInitPromise = Promise.withResolvers();
    connection.on("gameinit", (data) => {
        networkLogger.log("gameinit1");
        gameInitPromise.resolve(data);
    });

    connection.on("reconnect", (data) => {
        assert(data.data.serverId === data.from, `Different server ${data}`);
        window.location.reload();
    });

    const openCon = await connection.connect();
    networkLogger.log("connected");
    openCon.sendRawAll("join", {});
    const gameInitData = await Promise.race([gameInitPromise.promise, delayReject(5000)]);
    const game = beginGame(window, document, settings, gameFunction,
        networkLogger, openCon, gameInitData.data);
    return game;
}

import {assert} from "../utils/helper.js";
import connectionFunc from "../connection/broadcast.js";
import netObj from "./net.js";
import {beginGame} from "./client_helper.js";
import loggerFunc from "../views/logger.js";
import createSignalingChannel from "../connection/websocket_channel.js";

export default async function gameMode(window, document, settings, gameFunction) {

    const myId = netObj.getMyId(window, settings, Math.random);
    const networkLogger = loggerFunc(document, settings);
    const socketUrl = netObj.getWebSocketUrl(settings, window.location);
    const gamePromise = Promise.withResolvers();
    if (!socketUrl) {
        gamePromise.reject("No socket");
        return gamePromise.promise;
    }
    const gameChannel = createSignalingChannel(myId, socketUrl, networkLogger);
    const connection = connectionFunc(myId, networkLogger, gameChannel);

    const openConPromise = Promise.withResolvers();
    connection.on("gameinit", async (data) => {
        const openCon = await openConPromise.promise;
        const game = beginGame(window, document, settings, gameFunction,
            networkLogger, openCon, data.data);
        gamePromise.resolve(game);
    });

    connection.on("reconnect", (data) => {
        assert(data.data.serverId === data.from, `Different server ${data}`);
        window.location.reload();
    });

    await gameChannel.ready();
    const openCon = await connection.connect();
    openConPromise.resolve(openCon);
    networkLogger.log("connected");
    openCon.sendRawAll("join", {});
    return gamePromise.promise;
}

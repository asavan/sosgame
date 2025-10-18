import {assert} from "../utils/helper.js";
import {createSignalingChannel, broadcastConnectionFunc} from "netutils";
import netObj from "./net.js";
import {beginGame} from "./client_helper.js";
import loggerFunc from "../views/logger.js";

export default async function gameMode(window, document, settings, gameFunction) {

    const myId = netObj.getMyId(window, settings, Math.random);
    const networkLogger = loggerFunc(document, settings);
    const gamePromise = Promise.withResolvers();
    const gameChannel = await createSignalingChannel(myId, null, window.location, settings, networkLogger);
    const connection = broadcastConnectionFunc(myId, networkLogger, gameChannel);

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

    const openCon = await connection.connect();
    openConPromise.resolve(openCon);
    networkLogger.log("connected");
    openCon.sendRawAll("join", {});
    return gamePromise.promise;
}

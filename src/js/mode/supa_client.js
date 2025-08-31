import loggerFunc from "../views/logger.js";
import addSettingsButton from "../views/settings-form-btn.js";
import netObj from "./net.js";
import PromiseQueue from "../utils/async-queue.js";
import connectionFunc from "../connection/broadcast.js";
import {beginGame} from "./client_helper.js";
import supaLobby from "../connection/supabase_lobby.js";

export default async function gameMode(window, document, settings, gameFunction) {
    const networkLogger = loggerFunc(document, settings);
    addSettingsButton(document, settings);
    const myId = netObj.getMyId(window, settings, Math.random);
    const gameChannel = await supaLobby.makeSupaChanClient(myId, settings, networkLogger);

    const queue = PromiseQueue(networkLogger);

    const connection = connectionFunc(myId, networkLogger, gameChannel);
    const gamePromise = Promise.withResolvers();
    connection.on("gameinit", (data) => {
        networkLogger.log("init", data);
        const game = beginGame(window, document, settings, gameFunction,
            networkLogger, connection, connection, data, queue);
        gamePromise.resolve(game);
    });
    await connection.connect();
    connection.sendRawTo("join", {}, gameChannel.getServerId());
    return gamePromise.promise;
}

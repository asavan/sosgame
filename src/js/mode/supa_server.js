import loggerFunc from "../views/logger.js";
import addSettingsButton from "../views/settings-form-btn.js";
import supaChannel from "../connection/supabase_channel.js";
import netObj from "./net.js";
import {delay} from "../utils/helper.js";
import {beginGame} from "./server_helper.js";
import connectionFunc from "../connection/broadcast.js";
import PromiseQueue from "../utils/async-queue.js";
import {networkHandler} from "../connection/network_handler.js";

export default async function gameMode(window, document, settings, gameFunction) {
    const networkLogger = loggerFunc(document, settings);
    addSettingsButton(document, settings);
    const myId = netObj.getMyId(window, settings, Math.random);
    const gameChannel = supaChannel.createSignalingChannelWithName(
        supaChannel.getConnectionUrl(myId, settings), myId, networkLogger);
    const lobbyName = supaChannel.getConnectionUrl("lobby", settings);
    const lobbyChanel = supaChannel.createSignalingChannelWithName(lobbyName, myId, networkLogger);

    lobbyChanel.on("message", (json) => {
        networkLogger.log(json);
        if (json.action === "join") {
            lobbyChanel.send("in_lobby", {}, json.from);
            // await delay(1000);
            // gameChannel.send("lalala", {}, "all");
            return;
        }
        networkLogger.log("unknown action");
    });
    await Promise.all([gameChannel.ready(), lobbyChanel.ready(), delay(300)]);
    const queue = PromiseQueue(networkLogger);
    const networkActions = networkHandler({}, queue, networkLogger);

    const connection = connectionFunc(myId, networkLogger, networkActions, gameChannel);
    const game = beginGame(window, document, settings, gameFunction, connection, connection, myId);
    await connection.connect();
    return game;
}

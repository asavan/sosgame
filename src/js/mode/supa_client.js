import loggerFunc from "../views/logger.js";
import addSettingsButton from "../views/settings-form-btn.js";
import netObj from "./net.js";
import supaChannel from "../connection/supabase_channel.js";
import {delay} from "../utils/helper.js";
import PromiseQueue from "../utils/async-queue.js";
import {networkHandler} from "../connection/network_handler.js";
import connectionFunc from "../connection/broadcast.js";
import {beginGame} from "./client_helper.js";

export default async function gameMode(window, document, settings, gameFunction) {
    const networkLogger = loggerFunc(document, settings);
    addSettingsButton(document, settings);
    const myId = netObj.getMyId(window, settings, Math.random);
    const lobbyChanel = supaChannel.createSignalingChannelWithName("sos_lobby", myId, networkLogger);

    const servers = [];
    lobbyChanel.on("message", (json) => {
        networkLogger.log(json);
        if (json.action === "in_lobby") {
            servers.push(json.from);
            return;
        }
        networkLogger.log("unknown action");
    });
    await lobbyChanel.ready();
    lobbyChanel.send("join", {}, "all");
    await delay(500);
    // await Promise.all([, delay(3000)]);
    networkLogger.log("connected", myId);
    if (servers.length !== 1) {
        networkLogger.log(servers);
        // TODO show every service and make user choose
        return;
    }
    const serverId = servers[0];
    networkLogger.log("connected2", serverId);
    const gameChannel = supaChannel.createSignalingChannelWithName(
        supaChannel.getConnectionUrl(serverId), myId, networkLogger);

    const queue = PromiseQueue(networkLogger);
    const networkActions = networkHandler({}, queue, networkLogger);

    const connection = connectionFunc(myId, networkLogger, networkActions, gameChannel);
    const gamePromise = Promise.withResolvers();
    await connection.connect();
    connection.on("gameinit", (data) => {
        const game = beginGame(window, document, settings, gameFunction,
            networkLogger, connection, connection, data);
        gamePromise.resolve(game);
    });
    connection.sendRawTo("join", {}, serverId);
    return gamePromise.promise;
}

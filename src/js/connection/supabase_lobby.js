import {delay} from "../utils/helper.js";
import supaChannel from "../connection/supabase_channel.js";

async function makeSupaChanServer(id, settings, logger) {
    const name = supaChannel.getConnectionUrl(id, settings);
    const chan = supaChannel.createSignalingChannelWithName(name, id, logger);
    const lobbyName = supaChannel.getConnectionUrl("lobby", settings);
    const lobbyChanel = supaChannel.createSignalingChannelWithName(lobbyName, id, logger);

    lobbyChanel.on("message", (json) => {
        logger.log(json);
        if (json.from === id) {
            logger.error("Ignore self");
            return;
        }
        if (json.action === "join") {
            lobbyChanel.send("in_lobby", {}, json.from);
        }
        logger.log("unknown action");
    });

    await Promise.all([chan.ready(), lobbyChanel.ready()]);

    chan.clientModeName = () => "csupa";
    logger.log("supa chan ready");
    return chan;
}

async function makeSupaChanClient(myId, settings, networkLogger) {
    const lobbyName = supaChannel.getConnectionUrl("lobby", settings);
    const lobbyChanel = supaChannel.createSignalingChannelWithName(lobbyName, myId, networkLogger);

    const servers = [];
    lobbyChanel.on("message", (json) => {
        if (json.from === myId) {
            networkLogger.error("Ignore self");
            return;
        }
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
        return Promise.reject(myId);
    }
    const serverId = servers[0];
    networkLogger.log("connected2", serverId);
    const gameChannel = supaChannel.createSignalingChannelWithName(
        supaChannel.getConnectionUrl(serverId, settings), myId, networkLogger);
    gameChannel.getServerId = () => serverId;
    return gameChannel;
}


export default {
    makeSupaChanServer,
    makeSupaChanClient
};

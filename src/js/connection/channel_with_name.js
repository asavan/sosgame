import wsChannel from "./websocket_channel.js";
import netObj from "../mode/net.js";
import supaChannel from "../connection/supabase_channel.js";
import {delay} from "../utils/helper.js";

async function makeSupaChan(id, settings, logger) {
    const name = supaChannel.getConnectionUrl(id, settings);
    const chan = supaChannel.createSignalingChannelWithName(name, id, logger);
    const lobbyName = supaChannel.getConnectionUrl("lobby", settings);
    const lobbyChanel = supaChannel.createSignalingChannelWithName(lobbyName, id, logger);

    lobbyChanel.on("message", (json) => {
        logger.log(json);
        if (json.action === "join") {
            lobbyChanel.send("in_lobby", {}, json.from);
        }
        logger.log("unknown action");
    });

    await Promise.all([chan.ready(), lobbyChanel.ready()]);

    chan.clientModeName = () => "csupa";
    return chan;
}

const delayReject = async (ms) => {
    await delay(ms);
    return Promise.reject(new Error("timeout"));
}

export default async function createSignalingChannel(id, location, settings, logger) {
    const socketUrl = netObj.getWebSocketUrl(settings, location);
    if (!socketUrl) {
        return makeSupaChan(id, settings, logger);
    }
    try {
        const chan = wsChannel(id, socketUrl, logger);
        await Promise.race([chan.ready(), delayReject(1000)]);
        chan.clientModeName = () => "client";
        return chan;
    } catch (err) {
        logger.error(err);
        return makeSupaChan(id, settings, logger);
    }
}

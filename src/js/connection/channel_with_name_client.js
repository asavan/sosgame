import wsChannel from "./websocket_channel.js";
import netObj from "../mode/net.js";
import supaLobby from "../connection/supabase_lobby.js";
import {delay} from "../utils/helper.js";


const delayReject = async (ms) => {
    await delay(ms);
    return Promise.reject(new Error("timeout"));
};

export default async function createSignalingChannel(id, location, settings, logger) {
    const socketUrl = netObj.getWebSocketUrl(settings, location);
    if (!socketUrl) {
        return supaLobby.makeSupaChanClient(id, settings, logger);
    }
    try {
        const chan = wsChannel(id, socketUrl, logger);
        await Promise.race([chan.ready(), delayReject(1000)]);
        return chan;
    } catch (err) {
        logger.error(err);
        return supaLobby.makeSupaChanClient(id, settings, logger);
    }
}

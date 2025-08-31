import { createClient } from "@supabase/supabase-js";
import supabase_settings from "./supabase_settings.js";
import handlersFunc from "../utils/handlers.js";

function getConnectionUrl(id, settings) {
    return settings.gameChanPrefix + id;
}

function createSignalingChannelWithName(name, id, logger) {
    const handlers = handlersFunc(["error", "open", "message", "beforeclose", "close"]);
    const supabase = createClient(supabase_settings.SUPABASE_URL,
        supabase_settings.SUPA_API_ANON_KEY);
    const myChannel = supabase.channel(name);
    logger.log("chan: " + name);

    const send = (type, sdp, to, ignore) => {
        const json = {from: id, to: to, action: type, data: sdp, ignore};
        logger.log(name, "Sending [" + id + "] to [" + to + "]: " + JSON.stringify(json));
        return myChannel.send({
            type: "broadcast",
            event: type,
            payload: json,
        });
    };

    myChannel
        .on(
            "broadcast",
            { event: "*" }, // Listen for "shout". Can be "*" to listen to all events
            (payload) => {
                const json = payload.payload;
                return handlers.call("message", json);
            }
        );

    const readyPromise = new Promise((resolve, reject) => {
        myChannel.subscribe((status) => {
            if (status !== "SUBSCRIBED") {
                logger.error("SUBSCRIBED", status);
                myChannel.teardown();
                handlers.call("error", id);
                reject(status);
                return;
            }
            handlers.call("open", id);
            resolve(status);
        });
    });

    const close = async () => {
        await handlers.call("beforeclose", id);
        return myChannel.unsubscribe();
    };

    function ready() {
        return readyPromise;
    }

    // const getName = () => name;

    const on = (name, f) => handlers.on(name, f);
    return {on, send, close, ready};
}

export default {
    getConnectionUrl,
    createSignalingChannelWithName
};

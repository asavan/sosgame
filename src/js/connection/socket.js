import createSignalingChannel from "./common.js";
import handlersFunc from "../utils/handlers.js";
import {setupSignaling} from "./socket_helper.js";

function getWebSocketUrl(settings, location) {
    if (settings.wh) {
        return settings.wh;
    }
    if (location.protocol === "https:") {
        return;
    }
    return "ws://" + location.hostname + ":" + settings.wsPort;
}

export default function connectionFunc(id, logger, networkActions) {
    const handlers = handlersFunc(["close", "disconnect", "error", "join", "gameinit", "reconnect"]);

    function on(name, f) {
        return handlers.on(name, f);
    }

    function registerHandler(handler) {
        networkActions.changeHandler(handler);
    }

    function connect(socketUrl) {
        return new Promise((resolve, reject) => {
            if (!socketUrl) {
                reject(new Error("Can't determine ws address"));
                return;
            }
            const signaling = createSignalingChannel(id, socketUrl, logger);
            const setupPromise = setupSignaling(signaling, id, logger, handlers, networkActions);
            setupPromise.then(resolve).catch(reject);
        });
    }

    return {
        connect, on, getWebSocketUrl, registerHandler
    };
}

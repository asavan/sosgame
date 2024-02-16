import handlersFunc from "../utils/handlers.js";
import createSignalingChannel from "./common.js";

export default function connectionFunc(id, logger) {
    const handlers = handlersFunc(["gamemessage", "close", "disconnect", "error", "join", "gameinit"]);

    function on(name, f) {
        return handlers.on(name, f);
    }

    function getWebSocketUrl(settings, location) {
        if (settings.wh) {
            return settings.wh;
        }
        if (location.protocol === "https:") {
            return null;
        }
        return "ws://" + location.hostname + ":" + settings.wsPort;
    }

    function connect(socketUrl) {
        return new Promise((resolve, reject) => {
            if (!socketUrl) {
                reject("Can't determine ws address");
            }
            const signaling = createSignalingChannel(id, socketUrl, logger);
            signaling.on("message", async function(json) {
                if (json.from === id) {
                    logger.error("same user");
                    return;
                }

                if (json.to !== id && json.to != "all") {
                    logger.log("another user");
                    return;
                }

                if (json.ignore && Array.isArray(json.ignore) && json.ignore.includes(id)) {
                    logger.log("user in ignore list");
                    return;
                }

                if (json.action === "gamemessage") {
                    await handlers.call("gamemessage", json);
                }
                if (json.action === "gameinit") {
                    await handlers.call("gameinit", json);
                }
                if (json.action === "join") {
                    await handlers.call("join", json);
                }
            });

            const sendAll = (data, ignore) => {
                logger.log(data);
                return signaling.send("gamemessage", data, "all", ignore);
            };

            const join = (data) => signaling.send("join", data, "all");

            const sendTo = (data, to) => signaling.send("gamemessage", data, to);
            const init = (data, to) => signaling.send("gameinit", data, to);
            signaling.on("open", () => resolve({sendTo, sendAll, join, init}));
        });
    }
    return {
        connect, on, getWebSocketUrl
    };
}

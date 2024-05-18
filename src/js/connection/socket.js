import handlersFunc from "../utils/handlers.js";
import createSignalingChannel from "./common.js";

export default function connectionFunc(id, logger) {
    const handlers = handlersFunc(["close", "disconnect", "error", "join", "gameinit", "message", "gameover", "started"]);

    function on(name, f) {
        return handlers.on(name, f);
    }

    let currentHandler = {};
    let queue = null;

    function getWebSocketUrl(settings, location) {
        if (settings.wh) {
            return settings.wh;
        }
        if (location.protocol === "https:") {
            return null;
        }
        return "ws://" + location.hostname + ":" + settings.wsPort;
    }

    function registerHandler(handler, q) {
        queue = q;
        currentHandler = handler;
    }

    function callCurrentHandler(method, data) {    
        const callback = currentHandler[method];  
        if (typeof callback !== "function") {
            logger.log("Not function");
            return;
        }
        if (queue == null) {
            logger.log("No queue");
            return;
        }
        queue.add(() => callback(data.data, data.from));        
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
                if (handlers.actionKeys().includes(json.action)) {
                    return handlers.call(json.action, json);
                }
                if (Object.keys(currentHandler).includes(json.action)) {
                    return callCurrentHandler(json.action, json);
                }
                logger.log("Unknown action " + json.action);
            });

            const sendRawAll = (type, data, ignore) => {
                logger.log(data);
                return signaling.send(type, data, "all", ignore);
            };

            const join = (data) => signaling.send("join", data, "all");

            const sendRawTo = (type, data, to) => signaling.send(type, data, to);
            const init = (data, to) => signaling.send("gameinit", data, to);
            signaling.on("open", () => resolve({join, init, sendRawAll, sendRawTo}));
        });
    }
    return {
        connect, on, getWebSocketUrl, registerHandler
    };
}

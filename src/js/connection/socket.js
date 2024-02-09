"use strict";

import commonConnection from "./common.js";

function stub(message) {
    console.trace("Stub " + message);
}

export default function connectionFunc(settings, location, id, logger) {
    const handlers = {
        "recv": stub,
        "open": stub,
        "socket_open": stub,
        "socket_close": stub,
        "close": stub,
        "error": stub,
        "disconnect": stub
    };

    function on(name, f) {
        handlers[name] = f;
    }

    function getWebSocketUrl() {
        if (settings.wh) {
            return settings.wh;
        }
        if (location.protocol === "https:") {
            return null;
        }
        return "ws://" + location.hostname + ":" + settings.wsPort;
    }

    function connect() {
        return new Promise((resolve, reject) => {
            const socketUrl = getWebSocketUrl();
            if (socketUrl == null) {
                reject("Can't determine ws address");
            }
            const signaling = commonConnection.createSignalingChannel(id, socketUrl, logger, handlers, onOpen);
            signaling.onmessage = async function(json) {
                if (json.from === id) {
                    logger.error("same user");
                    return;
                }

                if (json.to !== id && json.to != "all") {
                    logger.log("another user");
                    return;
                }

                if (json.action === "gamemessage") {
                    await handlers["recv"](json.data, json.from);
                }
            };

            const sendAllExceptMe = (data) => {
                logger.log(data);
                return signaling.send("gamemessage", data, "all");
            };

            const sendAll = sendAllExceptMe;

            const sendTo = stub;

            function onOpen() {
                resolve({sendTo, sendAllExceptMe, sendAll});
            }
        });
    }
    return {
        connect, on
    };
}

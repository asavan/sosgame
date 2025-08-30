import handlersFunc from "../utils/handlers.js";

export default function connectionFunc(id, logger, signaling) {
    const handlers = handlersFunc(["close", "disconnect", "error", "join", "gameinit", "reconnect"]);

    let externalHandlers = null;

    function registerHandler(handler) {
        externalHandlers = handler;
    }

    function on(name, f) {
        return handlers.on(name, f);
    }

    function connect() {
        const signalPromise = Promise.withResolvers();
        signaling.on("error", (id) => {
            logger.log("Connection to ws error " + id);
            signalPromise.reject(id);
        });

        signaling.on("message", (json) => {
            logger.log("Received message", json);
            if (json.from === id) {
                logger.error("same user");
                return;
            }

            if (json.to !== id && json.to !== "all") {
                logger.log("another user");
                return;
            }

            if (json.ignore && Array.isArray(json.ignore) && json.ignore.includes(id)) {
                logger.log("user in ignore list");
                return;
            }
            if (handlers.hasAction(json.action)) {
                logger.log("handlers.actionKeys");
                return handlers.call(json.action, json);
            }
            if (externalHandlers && externalHandlers.hasAction(json.action)) {
                return externalHandlers.call(json.action, json.data);
            }
            logger.log("Unknown action " + json.action);
        });

        const sendRawAll = (type, data, ignore) => {
            logger.log(data);
            return signaling.send(type, data, "all", ignore);
        };

        const sendRawTo = (type, data, to) => signaling.send(type, data, to);
        signaling.on("open", () => signalPromise.resolve({sendRawAll, sendRawTo}));
        return signalPromise.promise;
    }

    const sendRawAll = (type, data, ignore) => {
        logger.log(data);
        return signaling.send(type, data, "all", ignore);
    };

    const sendRawTo = (type, data, to) => signaling.send(type, data, to);

    return {
        connect, on, registerHandler, sendRawAll, sendRawTo,
    };
}

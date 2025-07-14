export function setupSignaling(signaling, id, logger, handlers, currentHandler) {
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
        if (handlers.actionKeys().includes(json.action)) {
            logger.log("handlers.actionKeys");
            return handlers.call(json.action, json);
        }
        if (currentHandler.check(json.action)) {
            return currentHandler.process(json.action, json);
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

import handlersFunc from "../utils/handlers.js";
import {setupSignaling} from "./socket_helper.js";

export default function connectionFunc(id, logger, networkActions, signaling) {
    const handlers = handlersFunc(["close", "disconnect", "error", "join", "gameinit", "reconnect"]);

    function on(name, f) {
        return handlers.on(name, f);
    }

    function registerHandler(handler) {
        networkActions.changeHandler(handler);
    }

    function connect() {
        return setupSignaling(signaling, id, logger, handlers, networkActions);
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

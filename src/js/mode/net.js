import {error, log} from "../utils/helper.js";
import rngFunc from "../utils/random.js";

function networkLoggerFunc(logger, settings) {
    const logInner = (data) => {
        if (!settings.networkDebug) {
            return;
        }
        return log(data, logger);
    };
    const errorInner = (data) => {
        if (!logger) {
            return;
        }
        return error(data, logger);
    };
    return {
        log: logInner,
        error: errorInner
    };
}

function setupMedia() {
    if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        });
    } else {
        console.log("No mediaDevices");
    }
}

function getMyId(window, settings, rngEngine) {
    const data = window.sessionStorage.getItem(settings.idNameInStorage);
    if (data) {
        return data;
    }
    const newId = rngFunc.makeId(settings.idNameLen, rngEngine);
    window.sessionStorage.setItem(settings.idNameInStorage, newId);
}

function setupGameToConnectionSendClient(game, con, logger, data) {
    for (const handlerName of game.actionKeys()) {
        game.on(handlerName, (n) => {
            if (!n || (n.playerId !== null && n.playerId !== data.joinedInd)) {
                logger.log("ignore");
                return;
            }
            con.sendRawTo(handlerName, n, data.serverId);
        });
    }
}

function setupLogger(document, settings) {
    let logger;
    if (settings.logger) {
        logger = document.querySelector(settings.logger);
    }
    const networkLogger = networkLoggerFunc(logger, settings);
    return networkLogger;
}

export default {
    setupLogger,
    getMyId,
    setupMedia,
    setupGameToConnectionSendClient
};

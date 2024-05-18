import {log, error} from "../utils/helper.js";
import actionsFunc from "../actions.js";
import PromiseQueue from "../utils/async-queue.js";
import rngFunc from "../utils/random.js";


function runLoop2(logger) {
    return PromiseQueue(logger);
}

function setupProtocolRaw(connection, actions, queue) {
    for (const [method, callback] of Object.entries(actions)) {
        if (typeof callback !== "function") {
            continue;
        }
        connection.on(method, (data) => {
            queue.add(() => callback(data.data, data.from));
        });
    }
}


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
        return navigator.mediaDevices.getUserMedia({
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

function setupLogger(document, settings) {
    const logger = settings.logger ? document.querySelector(settings.logger) : null;
    const networkLogger = networkLoggerFunc(logger, settings);
    return networkLogger;
}

function setupGame(game, connection, queue) {
    const actions = actionsFunc(game);
    setupProtocolRaw(connection, actions, queue);
}

export default {
    setupGame,
    setupLogger,
    getMyId,
    setupMedia,
    runLoop2
};

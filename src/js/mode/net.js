import {log, error} from "../utils/helper.js";
import actionsFunc from "../actions.js";
import Queue from "../utils/queue.js";
import rngFunc from "../utils/random.js";

function toObjJson(v, method) {
    const value = {
        "method": method,
        "data": v
    };
    return value;
}

function loop(queue, window) {
    let inProgress = false;

    async function step() {
        if (!queue.isEmpty() && !inProgress) {
            const {callback, res, id} = queue.dequeue();
            inProgress = true;
            await callback(res, id);
            inProgress = false;
        }
        window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
}

function runLoop(window) {
    const queue = Queue();
    loop(queue, window);
    return queue;
}

function setupProtocol(connection, actions, queue) {
    connection.on("gamemessage", (data) => {
        console.log("gamemessage", data);
        const obj = data.data;
        const id = data.from;
        const res = obj.data;
        const callback = actions[obj.method];
        if (typeof callback === "function") {
            queue.enqueue({callback, res, fName: obj.method, id});
        }
    });
}


function setupProtocolRaw(connection, actions, queue) {
    for (const [method, callback] of Object.entries(actions)) {
        if (typeof callback !== "function") {
            continue;
        }
        connection.on(method, (data) => {
            const id = data.from;
            const res = data.data;
            queue.enqueue({callback, res, fName: method, id});
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
    setupProtocol(connection, actions, queue);
    setupProtocolRaw(connection, actions, queue);
}

export default {
    setupGame,
    setupLogger,
    getMyId,
    setupMedia,
    runLoop,
    setupProtocol,
    toObjJson
};

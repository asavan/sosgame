"use strict";

import {log, error} from "../utils/helper.js";
import actionsFunc from "../actions.js";
import Queue from "../utils/queue.js";
import connectionFunc from "../connection/socket.js";
import rngFunc from "../utils/random.js";
import presenterObj from "../presenter.js";


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

//function setupMedia() {
//    if (navigator.mediaDevices) {
//        return navigator.mediaDevices.getUserMedia({
//            audio: true,
//            video: true
//        });
//    } else {
//        console.log("No mediaDevices");
//    }
//}

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

function createGame(window, document, settings, connection, gameFunction, data, queue) {
    const presenter = presenterObj.presenterFunc(data.presenter, settings);
    const game = gameFunction(window, document, settings, presenter);
    const actions = actionsFunc(game);
    setupProtocol(connection, actions, queue);
    return game;
}

export default function gameMode(window, document, settings, gameFunction) {

    return new Promise((resolve, reject) => {
        const myId = getMyId(window, settings, Math.random);
        const networkLogger = setupLogger(document, settings);
        const connection = connectionFunc(myId, networkLogger);
        const queue = Queue();

        loop(queue, window);


        connection.connect(connection.getWebSocketUrl(settings, window.location)).then(con => {
            console.log("connected");
            connection.on("gameinit", (data) => {
                console.log("gameinit", data);
                const serverId = data.data.serverId;
                const game = createGame(window, document, settings, connection, gameFunction, data.data, queue);
                for (const handlerName of game.actionKeys()) {
                    game.on(handlerName, (n) => {
                        if (n.ignore && Array.isArray(n.ignore)) {
                            if (n.ignore.includes(serverId)) {
                                networkLogger.log("ignore");
                                return;
                            }
                        }
                        con.sendTo(toObjJson(n, handlerName), serverId);
                    });
                }
                resolve(game);
            });
            con.join();
        }).catch(e => {
            networkLogger.error(e);
            reject(e);
        });
    });
}

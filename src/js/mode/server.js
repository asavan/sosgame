"use strict";

import {removeElem, log, error} from "../utils/helper.js";
import actionsFunc from "../actions.js";
import qrRender from "../lib/qrcode.js";
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

function makeQr(window, document, settings) {
    const staticHost = settings.sh || window.location.href;
    const url = new URL(staticHost);
    console.log("enemy url", url.toString());
    return qrRender(url.toString(), document.querySelector(".qrcode"));
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
        const obj = data.json;
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
        if (!settings.networkDebug || !logger) {
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

export default function gameMode(window, document, settings, gameFunction) {

    return new Promise((resolve, reject) => {
        const myId = getMyId(window, settings, Math.random);
        const networkLogger = setupLogger(document, settings);
        const connection = connectionFunc(myId, networkLogger);
        const queue = Queue();

        loop(queue, window);
        const presenter = presenterObj.presenterFuncDefault(settings);
        const game = gameFunction(window, document, settings, presenter);


        connection.connect(connection.getWebSocketUrl(settings, window.location)).then(con => {
            const code = makeQr(window, document, settings);
            game.on("started", () => {removeElem(code);});

            connection.on("join", (data) => {
                console.log("join", data);
                const presenterObj = game.makePresenter(data.from);
                const toSend = {
                    serverId: myId,
                    presenter: presenterObj
                };
                con.init(toSend, data.from);
            });


            const actions = actionsFunc(game);
            setupProtocol(connection, actions, queue);

            for (const handlerName of game.actionKeys()) {
                game.on(handlerName, (n) => con.sendAll(toObjJson(n, handlerName)));
            }
            resolve(game);
        }).catch(e => {
            networkLogger.error(e);
            reject(e);
        });

    });
}

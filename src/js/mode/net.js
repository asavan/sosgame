import rngFunc from "../utils/random.js";

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
    return newId;
}

function getWebSocketUrl(settings, location) {
    if (settings.wh) {
        return settings.wh;
    }
    if (location.protocol === "https:") {
        return;
    }
    return "ws://" + location.hostname + ":" + settings.wsPort;
}

function setupGameToConnectionSendClient(game, con, logger, data) {
    for (const handlerName of game.actionKeys()) {
        game.on(handlerName, (n) => {
            if (!n || (n.playerId !== null && n.playerId !== data.joinedInd)) {
                logger.log("ignore", n);
                return;
            }
            con.sendRawTo(handlerName, n, data.serverId);
        });
    }
}


export default {
    getMyId,
    setupMedia,
    setupGameToConnectionSendClient,
    getWebSocketUrl
};

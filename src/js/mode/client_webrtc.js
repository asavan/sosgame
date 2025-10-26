import {beginGame} from "./client_helper.js";

import {
    assert,
    addSettingsButton, client_chan,
    broadcastConnectionFunc,
    delayReject, loggerFunc, netObj
} from "netutils";

export default async function gameMode(window, document, settings, gameFunction) {
    console.time("loadgame");
    addSettingsButton(document, settings);
    const mainSection = document.querySelector(".game");
    mainSection.classList.add("hidden");
    const mainLogger = loggerFunc(document, settings, 2, null, "mainLog");
    const myId = netObj.getMyId(window, settings, Math.random);
    let commChan = await client_chan(myId, window, document, settings);

    const connectionLogger = loggerFunc(document, settings, 1, null, "clientRtcBroadConn1");
    const connection = broadcastConnectionFunc(myId, connectionLogger, commChan);
    const gameInitPromise = Promise.withResolvers();
    connection.on("gameinit", (data) => {
        gameInitPromise.resolve(data);
    });

    connection.on("reconnect", (data) => {
        assert(data.data.serverId === data.from, `Different server ${data}`);
        const url = new URL(window.location.href);
        url.searchParams.delete("z");
        url.searchParams.set("serverId", data.data.serverId);
        // history.pushState({}, document.title, url.href);
        // window.location.reload();
        window.location.replace(url.toString());
    });

    const openCon = await connection.connect();
    openCon.sendRawAll("join", {});
    mainLogger.log("joined. Wait for gameinit");
    const gameInitData = await Promise.race([gameInitPromise.promise, delayReject(5000)]);
    const game = beginGame(window, document, settings, gameFunction,
        mainLogger, openCon, gameInitData.data);
    return game;
}

import {createSignalingChannel, loggerFunc, netObj} from "netutils";
import {beginGame, gameInitClient} from "./client_helper.js";

export default async function gameMode(window, document, settings, gameFunction) {
    const myId = netObj.getMyId(window, settings, Math.random);
    const networkLogger = loggerFunc(document, settings);
    const gameChannel = await createSignalingChannel(myId, null, window.location, settings, networkLogger);
    const gameInitData = await gameInitClient(document, settings, myId, gameChannel, window, networkLogger);
    const game = beginGame(window, document, settings, gameFunction,
        networkLogger, gameChannel, gameInitData.data, myId);
    return game;
}

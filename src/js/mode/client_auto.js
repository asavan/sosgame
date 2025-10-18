import {loggerFunc} from "netutils";

const modes = [import("./client_webrtc.js"), import("./hotseat.js")];

const runSafe = async (index, window, document, settings, gameFunction, logger) => {
    if (index >= modes.length) {
        throw new Error("No such mode");
    }
    const modeName = modes[index];
    const mode = await modeName;
    try {
        logger.log("Try mode " + index);
        const game = await mode.default(window, document, settings, gameFunction);
        logger.log("Choose mode " + index);
        return game;
    } catch (e) {
        logger.error(e);
        return runSafe(index + 1, window, document, settings, gameFunction, logger);
    }
};

export default function gameMode(window, document, settings, gameFunction) {
    const logger = loggerFunc(document, settings, 2, null, "modeChooseLog");
    return runSafe(0, window, document, settings, gameFunction, logger);
}

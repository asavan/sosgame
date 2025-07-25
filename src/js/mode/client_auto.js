const modes = [import("./client.js"), import("./supa_client.js"), import("./hotseat.js")];

const runSafe = async (index, window, document, settings, gameFunction) => {
    if (index >= modes.length) {
        return Promise.reject(new Error("No such mode"));
    }
    const modeName = modes[index];
    const mode = await modeName;
    try {
        const game = await mode.default(window, document, settings, gameFunction);
        return game;
    } catch (e) {
        console.error(e);
        return runSafe(index + 1, window, document, settings, gameFunction);
    }
};

export default function gameMode(window, document, settings, gameFunction) {
    return runSafe(0, window, document, settings, gameFunction);
}

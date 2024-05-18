"use strict";

import settings from "./settings.js";
import gameFunction from "./game.js";
import {parseSettings, assert} from "./utils/helper.js";

function adjustSettings(settings) {
    if (settings.colorOrder.length > settings.playerLimit) {
        settings.colorOrder.splice(settings.playerLimit);
    }
}

export default async function starter(window, document) {
    parseSettings(window, document, settings);
    adjustSettings(settings);

    let mode = null;
    if (settings.mode === "client") {
        mode = await import("./mode/client.js");
    } else if (settings.mode === "server") {
        mode = await import("./mode/server.js");
    } else if (settings.mode === "servernew") {
        mode = await import("./mode/server_new.js");
    } else if (settings.mode === "ai") {
        mode = await import("./mode/ai.js");
    } else if (settings.mode === "hotseat") {
        mode = await import("./mode/hotseat.js");
    } else if (settings.mode === "test") {
        mode = await import("./mode/test.js");
    } else {
        assert(false, "Unsupported mode");
    }
    mode.default(window, document, settings, gameFunction).
        catch((error) => {console.error(error);});

    return mode;
}

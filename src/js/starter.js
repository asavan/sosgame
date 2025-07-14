"use strict";

import {assert, parseSettings} from "./utils/helper.js";
import gameFunction from "./game.js";
import settings from "./settings.js";
import loggerFunc from "./views/logger.js";

function adjustSettings(settings) {
    if (settings.colorOrder.length > settings.playerLimit) {
        settings.colorOrder.splice(settings.playerLimit);
    }
}

function adjustMode(changed, settings, queryString) {
    const keepModes = ["mode"];
    for (const keepMode of keepModes) {
        if (changed.includes(keepMode)) {
            return;
        }
    }
    const urlParams = new URLSearchParams(queryString);
    if (urlParams.has("c")) {
        settings.mode = "cwrtc";
    }
}

export default async function starter(window, document) {
    const changed = parseSettings(window.location.search, settings);
    adjustSettings(settings);
    adjustMode(changed, settings, window.location.search);
    const mainLogger = loggerFunc(document, settings);

    let mode;
    if (settings.mode === "client") {
        mode = await import("./mode/client.js");
    } else if (settings.mode === "server") {
        mode = await import("./mode/server.js");
    } else if (settings.mode === "ai") {
        mode = await import("./mode/ai.js");
    } else if (settings.mode === "hotseat") {
        mode = await import("./mode/hotseat.js");
    } else if (settings.mode === "test") {
        mode = await import("./mode/test.js");
    } else if (settings.mode === "swrtc") {
        mode = await import("./mode/server_webrtc.js");
    } else if (settings.mode === "cwrtc") {
        mode = await import("./mode/client_webrtc.js");
    } else if (settings.mode === "ssupa") {
        mode = await import("./mode/supa_server.js");
    } else if (settings.mode === "csupa") {
        mode = await import("./mode/supa_client.js");
    } else {
        assert(false, "Unsupported mode");
    }
    mode.default(window, document, settings, gameFunction).
        catch((error) => {
            mainLogger.error(error);
        });

    return mode;
}

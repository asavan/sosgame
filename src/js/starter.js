"use strict";

import {assert, parseSettings} from "./utils/helper.js";
import gameFunction from "./game.js";
import settings from "./settings.js";

function adjustSettings(settings) {
    if (settings.colorOrder.length > settings.playerLimit) {
        settings.colorOrder.splice(settings.playerLimit);
    }
}

export default async function starter(window, document) {
    parseSettings(window, document, settings);
    adjustSettings(settings);

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
    } else {
        assert(false, "Unsupported mode");
    }
    mode.default(window, document, settings, gameFunction).
        catch((error) => {
            console.error(error);
        });

    return mode;
}

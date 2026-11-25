import {assert, loggerFunc, parseZipSettings} from "netutils";
import gameFunction from "./game.js";
import settings from "./settings.js";
import {appConnector} from "./app_connector.js";

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
    const changed = await parseZipSettings(window.location.search, settings);
    adjustSettings(settings);
    adjustMode(changed, settings, window.location.search);
    const mainLogger = loggerFunc(document, settings);
    const appC = appConnector(window, settings, mainLogger);
    mainLogger.log("Choosen mode " + settings.mode);
    let mode;
    if (settings.mode === "client") {
        mode = await import("./mode/client.js");
    } else if (settings.mode === "server") {
        mode = await import("./mode/server.js");
    } else if (settings.mode === "ai") {
        mode = await import("./mode/ai.js");
    } else if (settings.mode === "hotseat") {
        mode = await import("./mode/hotseat.js");
    } else if (settings.mode === "test_server") {
        mode = await import("./mode/test_server.js");
    } else if (settings.mode === "test_client") {
        mode = await import("./mode/test_client.js");
    } else if (settings.mode === "swrtc") {
        mode = await import("./mode/server_webrtc.js");
    } else if (settings.mode === "cwrtc") {
        mode = await import("./mode/client_webrtc.js");
    } else if (settings.mode === "cauto") {
        mode = await import("./mode/client_auto.js");
    } else {
        assert(false, "Unsupported mode");
    }
    mode.default(window, document, settings, gameFunction, appC).
        catch((error) => {
            mainLogger.error(error);
        });

    return mode;
}

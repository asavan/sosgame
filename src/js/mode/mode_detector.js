import {isTWA} from "../twa_test.js";

const LOCALHOST = 0;
const HTTP = 1;
const HTTPS = 2;


function locationMode(window) {
    if (window.isSecureContext) {
        if (window.location.protocol === "https:") {
            return HTTPS;
        }
        return LOCALHOST;
    }
    return HTTP;
}

export function modeDetector(window, document)  {
    const BROWSER = 0;
    const TWA = 1;
    const modes = [
        ["server", "client", "ai"],
        ["server", "server", "server"],
    ];

    const twaMode = isTWA(window, document) ? 1 : 0;
    const lMode = locationMode(window);
    return modes[lMode][twaMode];
}

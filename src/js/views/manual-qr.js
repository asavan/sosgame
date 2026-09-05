import {makeQrAny} from "../mode/server_helper.js";

export function qrHandler(window, document) {
    const inEl = document.querySelector(".qr-input");
    if (!inEl) {
        console.log("invalid input");
        return;
    }
    inEl.classList.remove("hidden");
    let code = null;
    const showQr = () => {
        const inputVal = inEl.value;
        if (code) {
            code.remove();
        }
        code = makeQrAny(inputVal, document);
    };
    inEl.oninput = showQr;
}

import {QRCodeSVG} from "@akamfoad/qrcode";

export function bigPicture(elem) {
    elem.addEventListener("click", () => elem.classList.toggle("big"));
}

async function writeClipboardText(text) {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
        }
    } catch (error) {
        console.error(error.message);
    }
}

function shareAndCopy(elem, url) {
    const shareData = {
        title: "Sos game",
        url: url,
    };
    elem.addEventListener("dblclick", async () => {
        await writeClipboardText(url);
        try {
            if (navigator.share && navigator.maxTouchPoints > 1) {
                await navigator.share(shareData);
            }
        } catch (err) {
            console.error(err);
        }
    });
}

function chomp(string, c) {
    if (string.endsWith(c)) {
        return string.slice(0, -c.length);
    }
    return string;
}

function renderQRCodeSVG(text, divElement) {
    const options = {
        level: "M",
        padding: 3,
    };
    if (text.length < 100) {
        options.image = {
            source: "./images/sos.png",
            width: "10%",
            height: "20%",
            x: "center",
            y: "center"
        };
    }
    const qrSVG = new QRCodeSVG(text, options);
    divElement.innerHTML = qrSVG.toString();
}

export function removeElem(el) {
    if (el) {
        el.remove();
    }
}

export function makeQrPlain(urlStr, document, selector) {
    const el = document.querySelector(selector);
    if (!el) {
        console.log("No qr");
        return el;
    }
    const divToRender = document.createElement("div");
    el.append(divToRender);
    return makeQrElement(urlStr, divToRender);
}

export function makeQrElement(urlStr, el) {
    urlStr = chomp(urlStr, "/");
    console.log("enemy url", urlStr, urlStr.length);
    renderQRCodeSVG(urlStr, el);
    // bigPicture(el);
    shareAndCopy(el, urlStr);
    bigPicture(el);
    return el;
}

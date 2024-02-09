"use strict";

export function hideElem(el) {
    if (el) {
        el.classList.add("hidden");
    }
}

export function showElem(el) {
    if (el) {
        el.classList.remove("hidden");
    }
}

export function removeElem(el) {
    if (el) {
        el.remove();
    }
}

export function swapNodes(n1, n2) {

    let p1 = n1.parentNode;
    let p2 = n2.parentNode;
    let i1, i2;

    if ( !p1 || !p2 || p1.isEqualNode(n2) || p2.isEqualNode(n1) ) return;

    for (let i = 0; i < p1.children.length; i++) {
        if (p1.children[i].isEqualNode(n1)) {
            i1 = i;
        }
    }
    for (let i = 0; i < p2.children.length; i++) {
        if (p2.children[i].isEqualNode(n2)) {
            i2 = i;
        }
    }

    if ( p1.isEqualNode(p2) && i1 < i2 ) {
        i2++;
    }
    p1.insertBefore(n2, p1.children[i1]);
    p2.insertBefore(n1, p2.children[i2]);
}


export function vibrateIfNeeded(window, inactivePeriod, lastInteractTime) {
    if (inactivePeriod && window.navigator.vibrate) {
        const now = Date.now();
        if ((now - lastInteractTime) > inactivePeriod * 1000) {
            window.navigator.vibrate([200]);
        }
    }
}

function logToHtml(message, el) {
    if (!el) {
        return;
    }
    if (typeof message == "object") {
        el.innerHTML += (JSON && JSON.stringify ? JSON.stringify(message) : message) + "<br />";
    } else {
        el.innerHTML += message + "<br />";
    }
}

export function error(message, el) {
    logToHtml(message, el);
    console.error(message);
}

export function log(settings, message, el) {
    if (settings.logger && el) {
        if (typeof message == "object") {
            el.innerHTML += (JSON && JSON.stringify ? JSON.stringify(message) : message) + "<br />";
        } else {
            el.innerHTML += message + "<br />";
        }
    }
    console.log(message);
}

export function logHtml(message, el) {
    if (el) {
        if (typeof message == "object") {
            el.innerHTML += (JSON && JSON.stringify ? JSON.stringify(message) : message) + "<br />";
        } else {
            el.innerHTML += message + "<br />";
        }
    }
    console.log(message);
}

function stringToBoolean(string){
    switch(string.toLowerCase().trim()){
    case "true": case "yes": case "1": return true;
    case "false": case "no": case "0": case null: return false;
    default: return Boolean(string);
    }
}

export function parseSettings(window, document, settings) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    for (const [key, value] of urlParams) {
        if (typeof settings[key] === "number") {
            settings[key] = parseInt(value, 10);
        } else if (typeof settings[key] === "boolean") {
            settings[key] = stringToBoolean(value);
        } else {
            settings[key] = value;
        }
    }
}

export const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export function promiseState(promise) {
    const pendingState = { status: "pending" };

    return Promise.race([promise, pendingState]).then(
        (value) =>
            value === pendingState ? value : { status: "fulfilled", value },
        (reason) => ({ status: "rejected", reason }),
    );
}

export function assert(b, message) {
    if (b) return;
    console.error(message);
    throw message;
}

export function pluralize(count, noun, suffix = "s"){
    return `${count} ${noun}${count !== 1 ? suffix : ""}`;
}

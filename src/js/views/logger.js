export default function loggerFunc(document, settings, level, el) {
    if (!level) {
        level = settings.level;
    }
    if (!el) {
        el = settings.logger;
    }
    if (el && typeof el === "string") {
        el = document.querySelector(el);
    }
    const logHtml = (message) => {
        if (el) {
            if (typeof message == "object" && JSON && JSON.stringify ) {
                el.innerHTML += JSON.stringify(message) + "<br />";
            } else {
                el.innerHTML += message + "<br />";
            }
        }
    };

    const logInner = (data, ...args) => {
        if (level < settings.logLevel) {
            return;
        }
        logHtml(data);
        return console.log(data, ...args);
    };
    const errorInner = (data, ...args) => {
        if (level >= settings.logLevel) {
            logHtml(data);
        }
        console.trace(data);
        return console.error(data, ...args);
    };

    return {
        log: logInner,
        error: errorInner
    };
}

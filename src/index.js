import install from "./js/utils/install_as_app.js";
import starter from "./js/starter.js";

if (__USE_SERVICE_WORKERS__) {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./sw.js", {scope: "./"});
        install(window, document);
    }
}

window.addEventListener("unhandledrejection", (event) => {
    console.warn(`UNHANDLED PROMISE REJECTION: ${event.reason}`);
    // event.preventDefault();
});

starter(window, document);

import { delay, loggerFunc } from "netutils";

export function appConnector(window) {
    const c1 = {
        logger: ".log",
        logLevel: 2,
    };

    const initLogger = loggerFunc(document, c1, 4, null, "initLogger");

    let portSender = null;

    const runWithDelay = async () => {
        initLogger.log("before start");
        await delay(2000);
        const payload = JSON.stringify({ action: "DATA1", value: "123" });
        initLogger.log("try send message " + payload);
        portSender?.postMessage(payload);
        initLogger.log("after message");
    };

    window.addEventListener("unhandledrejection", (event) => {
        initLogger.error(`UNHANDLED PROMISE REJECTION: ${event.reason}`);
        // event.preventDefault();
    });

    window.addEventListener("appinstalled", () => {
        initLogger.log("APPINSTALLED");
    });

    window.addEventListener("message", (event) => {
        // We are receiveing messages from any origin, you can check of the origin by
        // using event.origin

        initLogger.log("got message " + event.origin);
        initLogger.log("got message1 " + event.data);
        // get the port then use it for communication.
        const port = event.ports[0];
        if (typeof port === "undefined") {
            initLogger.log("No ports found.");
            return;
        }

        if (event.source === port) {
            initLogger.log("First port and source is same");
        } else {
            initLogger.log("Send to source back");
            // event.source.postMessage(
            //     "hi there yourself! the secret response is: rheeeeet!",
            //     event.origin
            // );
        }

        // Post message on this port.
        port.postMessage("Web ready");

        // Receive upcoming messages on this port.
        port.onmessage = function(event) {
            initLogger.log("got message2 " + event.data);
            initLogger.log("got message3 " + event.origin);
            // console.log("[PostMessage1] Got message" + event.data);
        };

        portSender = port;
    });
    runWithDelay();

    const send = (data) => {
        initLogger.log("send", data);
        portSender.postMessage(data);
    };
    return {send};
}


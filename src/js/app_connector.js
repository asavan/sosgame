import { delay, loggerFunc } from "netutils";
import {fetchFileContent3} from "./downloader.js";

async function handleMessage(jsonString, port) {
    let data;

    // 1. Пытаемся распарсить строку в JSON
    try {
        data = JSON.parse(jsonString);
    } catch (ignored) {
        // Если строка не валидный JSON, просто выходим из функции
        return ignored;
    }

    // 2. Проверяем, что результат парсинга — это именно объект (не null и не массив)
    // и проверяем поле type === "request"
    if (
        typeof data === "object" &&
        data !== null &&
        !Array.isArray(data) &&
        data.type === "request"
    ) {
        try {
            // 3. Вызываем асинхронную функцию с полем name
            const result = await fetchFileContent3(data.name);

            // 4. Преобразуем полученный JSON в строку и отправляем в port
            port.postMessage(JSON.stringify(result));
        } catch (error) {
            console.error("Ошибка при получении или отправке файла:", error);
        }
    }
}


export function appConnector(window) {
    const c1 = {
        logger: ".log",
        logLevel: 2,
    };

    const initLogger = loggerFunc(document, c1, 4, null, "initLogger");

    let portSender = null;

    const runWithDelay = async () => {
        await delay(200);
        const payload = JSON.stringify({ type: "browserserver" });
        if (portSender) {
            initLogger.log("try send message " + payload);
            portSender.postMessage(payload);
        }
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
        port.onmessage = async function(event) {
            initLogger.log("got message2 " + event.data);
            initLogger.log("got message3 " + event.origin);

            await handleMessage(event.data, port);
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

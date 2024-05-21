import handlersFunc from "../utils/handlers.js";

function stub() {
    // do nothing.
}

export default function createSignalingChannel(id, socketUrl, logger) {
    const handlers = handlersFunc(["error", "open", "message", "beforeclose", "close"]);
    const ws = new WebSocket(socketUrl);

    const send = (type, sdp, to, ignore) => {
        const json = {from: id, to: to, action: type, data: sdp, ignore};
        logger.log("Sending [" + id + "] to [" + to + "]: " + JSON.stringify(sdp));
        return ws.send(JSON.stringify(json));
    };

    const close = async () => {
        // iphone fires "onerror" on close socket
        await handlers.call("beforeclose", id);
        ws.onerror = stub;
        return ws.close();
    };

    const on = (name, f) => {
        return handlers.on(name, f);
    };

    function onMessageInner(text) {
        logger.log("Websocket message received: " + text);
        const json = JSON.parse(text);
        return handlers.call("message", json);
    }

    ws.onopen = function() {
        return handlers.call("open", id);
    };

    ws.onclose = function (e) {
        logger.log("Websocket closed " + e.code + " " + e.reason);
        return handlers.call("close", id);
    };

    ws.onmessage = function (e) {
        if (e.data instanceof Blob) {
            const reader = new FileReader();
            reader.onload = () => {
                return onMessageInner(reader.result);
            };
            return reader.readAsText(e.data);
        } else {
            return onMessageInner(e.data);
        }
    };
    ws.onerror = function (e) {
        logger.error(e);
        return handlers.call("error", id);
    };
    return {on, send, close};
}

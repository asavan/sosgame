"use strict";

function stub() {}

function createSignalingChannel(id, socketUrl, logger, handlers, onOpen) {
    const ws = new WebSocket(socketUrl);

    const send = (type, sdp, to) => {
        const json = {from: id, to: to, action: type, data: sdp};
        logger.log("Sending [" + id + "] to [" + to + "]: " + JSON.stringify(sdp));
        return ws.send(JSON.stringify(json));
    };

    const close = () => {
        // iphone fires "onerror" on close socket
        handlers["error"] = stub;
        ws.close();
    };

    const onmessage = stub;
    const result = {onmessage, send, close};

    function onMessageInner(text) {
        logger.log("Websocket message received: " + text);
        const json = JSON.parse(text);
        return result.onmessage(json);
    }

    ws.onopen = function() {
        return onOpen(id);
    };

    ws.onclose = function (e) {
        logger.log("Websocket closed " + e.code + " " + e.reason);
        return handlers["socket_close"](id);
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
        return handlers["error"]("ws error");
    };
    return result;
}

export default {
    createSignalingChannel
};

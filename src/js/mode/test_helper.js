import {handlersFunc, negotiator, createDataChannelV2} from "netutils";

export function jsonSocketChan(socketUrl, logger) {
    const handlers = handlersFunc(["error", "open", "message", "beforeclose", "close"]);
    const connectionPromise = Promise.withResolvers();

    function onMessageInner(text) {
        const data = JSON.parse(text);
        logger.log("Websocket message received: " + text, data);
        return handlers.call("message", data);
    }

    const ws = new WebSocket(socketUrl);
    ws.onopen = function () {
        logger.log("Websocket opened");
        connectionPromise.resolve();
    };
    const ready = () => connectionPromise.promise;
    const send = (data) => ws.send(JSON.stringify(data));

    ws.onclose = function (e) {
        logger.log("Websocket closed " + e.code + " " + e.reason);
    };

    ws.onmessage = async function (e) {
        if (e.data instanceof Blob) {
            const text = await e.data.text();
            return onMessageInner(text);
        }
        return onMessageInner(e.data);
    };

    ws.onerror = function (e) {
        logger.error(e);
    };

    const close = async () => {
        connectionPromise.reject("close");
        // iphone fires "onerror" on close socket
        await handlers.call("beforeclose", {});
        return ws.close();
    };

    return {...handlers, ready, send, close};
}


export function fromSender(id, parentSender) {
    return {
        ...parentSender, // Pass through unaffected methods
        send(data) {
            data.from = id;
            return parentSender.send(data);
        }
    };
}

export function toSender(id, parentSender) {
    return {
        ...parentSender, // Pass through unaffected methods
        send(data) {
            data.to = id;
            return parentSender.send(data);
        }
    };
}

export function wrapJsonNetworkToNegotiator(net1, logger, id) {
    const neg1 = negotiator({});
    net1.on("message", data => {
        logger.log("Received message", data);
        if (data.from === id) {
            logger.error("same user");
            return;
        }

        if (data.to && data.to !== id && data.to !== "all") {
            logger.log("another user");
            return;
        }
        neg1.parseData(data);
    });
    const fSender = fromSender(id, net1);
    const sender = (data) => {
        fSender.send(data);
    };
    neg1.setParentSender(sender);
    return neg1;
}

function newNetworkHandler(id, netNeg, logger, parentSender, initiator) {
    const tSender = {
        send(data) {
            const toSend = {};
            toSend[netNeg.getName()] = data;
            toSend.to = id;
            parentSender.send(toSend);
            return toSend;
        }
    };

    const rtcC = createDataChannelV2(logger, initiator);
    const addRemote = (data) => {
        logger.log("addRemote", data);
        return rtcC.processAnswer(data);
    };
    const addRemoteFirst = (data) => {
        logger.log("addRemote first", data);
        return rtcC.processOffer(data);
    };
    const {createOffer} = rtcC;
    rtcC.on("remote", (r) => {
        logger.log("RTC Remote received", r);
        tSender.send({"remote": r});
    });

    const send = (data) => tSender.send(data);
    return {
        addRemote,
        addRemoteFirst,
        createOffer,
        send
    };
}

export function netHandler(logger, parentSender) {
    const netNeg = negotiator({name: "network"});
    const clients = {};
    const actions = {
        "join": (data) => {
            let client = clients[data];
            if (!client) {
                client = newNetworkHandler(data, netNeg, logger, parentSender, true);
                clients[data] = client;
            }
            client.createOffer(data);
        },
        "remote": (data, context) => {
            const client = clients[context.from];
            if (!client) {
                logger.log("No client");
                const client = newNetworkHandler(context.from, netNeg, logger, parentSender, false);
                clients[context.from] = client;
                client.addRemoteFirst(data);
                return;
            }
            client.addRemote(data);
        }
    };

    for (const key in actions) {
        const acNeg = negotiator({name: key, callback: actions[key]});
        netNeg.registerHandler(acNeg);
    }
    parentSender.registerHandler(netNeg);
    return netNeg;
}

function createChannel(initialTransport = null) {
    const listeners = new Map();
    const children = new Map();
    const queues = new Map();

    let currentTransport = null;
    let unsubscribeTransport = null;

    function enqueue(key, task) {
        const prev = queues.get(key) || Promise.resolve();
        const next = prev
            .then(() => task())
            .catch((err) => console.error(`[Channel error "${key}"]:`, err));
        queues.set(key, next);
        return next;
    }

    function handleIncoming(payload) {
        if (!payload || typeof payload !== 'object') return Promise.resolve();

        const rootListener = listeners.get('');
        if (rootListener) {
            return Promise.resolve(rootListener(payload));
        }

        const tasks = Object.entries(payload).map(([key, data]) =>
            enqueue(key, async () => {
                const listener = listeners.get(key);
                if (listener) await listener(data, payload);

                const child = children.get(key);
                if (child) await child.deliver(data);
            })
        );

        return Promise.all(tasks);
    }

    function disconnect() {
        if (unsubscribeTransport) {
            unsubscribeTransport();
            unsubscribeTransport = null;
        }
        currentTransport = null;
    }

    function connect(transport) {
        disconnect();
        if (!transport) return;

        currentTransport = transport;

        if (transport.on) {
            unsubscribeTransport = transport.on('', (packet) => {
                handleIncoming(packet);
            });
        }
    }

    function send(data) {
        currentTransport?.send(data);
    }

    function on(name, callback) {
        listeners.set(name, callback);
        return () => {
            if (listeners.get(name) === callback) listeners.delete(name);
        };
    }

    function off(name) {
        listeners.delete(name);
    }

    function waitOnce(name) {
        return new Promise((resolve) => {
            const unsubscribe = on(name, (data) => {
                unsubscribe();
                resolve(data);
            });
        });
    }

    function onMap(map) {
        const unsubs = Object.entries(map).map(([name, cb]) => on(name, cb));
        return () => unsubs.forEach((fn) => fn());
    }

    function channel(name) {
        if (!children.has(name)) {
            let deliverToChild = null;

            const childChannel = createChannel({
                send: (data) => send({ [name]: data }),
                on: (key, cb) => {
                    if (key === '') {
                        deliverToChild = cb;
                        return () => { deliverToChild = null; };
                    }
                },
            });

            children.set(name, {
                instance: childChannel,
                deliver: (data) => deliverToChild?.(data),
            });
        }
        return children.get(name).instance;
    }

    if (initialTransport) {
        connect(initialTransport);
    }

    return {
        connect,
        disconnect,
        on,
        off,
        waitOnce,
        onMap,
        channel,
        send,
    };
}


function withAddressing(target, myId) {
    const isForMe = (payload) => {
        if (!payload || typeof payload !== 'object') return false;
        if ('to' in payload && payload.to !== myId && payload.to !== 'all') {
            return false;
        }
        return true;
    };

    function send(data) {
        return target.send({ ...data, from: myId });
    }

    function on(name, callback) {
        return target.on(name, (data, fullPacket) => {
            const packetToCheck = name === '' ? data : fullPacket;
            if (packetToCheck && !isForMe(packetToCheck)) return;
            return callback(data, fullPacket);
        });
    }

    function waitOnce(name) {
        return new Promise((resolve) => {
            const unsub = on(name, (data) => {
                unsub();
                resolve(data);
            });
        });
    }

    function onMap(map) {
        const unsubs = Object.entries(map).map(([name, cb]) => on(name, cb));
        return () => unsubs.forEach((fn) => fn());
    }

    function channel(name) {
        // Оборачиваем подканал так же, чтобы он отправлял через новый send
        const child = target.channel(name);
        return {
            ...child,
            send: (data) => send({ [name]: data }),
        };
    }

    // Если передан сырой транспорт (без методов канала), вернем только { send, on }
    if (!target.channel) {
        return { ...target, send, on };
    }

    return {
        ...target,
        send,
        on,
        waitOnce,
        onMap,
        channel,
    };
}

function wrapChannel(target, { send = target.send, on = target.on } = {}) {
    // Если передан сырой транспорт (без методов канала), возвращаем только { send, on }
    if (!target.channel) {
        return {
            ...target,
            send,
            on,
        };
    }

    function waitOnce(name) {
        return new Promise((resolve) => {
            const unsub = on(name, (data) => {
                unsub();
                resolve(data);
            });
        });
    }

    function onMap(map) {
        const unsubs = Object.entries(map).map(([name, cb]) => on(name, cb));
        return () => unsubs.forEach((fn) => fn());
    }

    function channel(name) {
        const child = target.channel(name);
        // Оборачиваем подканал, чтобы он отправлял данные через новый `send`
        return wrapChannel(child, {
            send: (data) => send({ [name]: data }),
        });
    }

    return {
        ...target,
        send,
        on,
        waitOnce,
        onMap,
        channel,
    };
}


function withAddressing(target, myId) {
    const isForMe = (payload) => {
        if (!payload || typeof payload !== 'object') return false;
        if ('to' in payload && payload.to !== myId && payload.to !== 'all') {
            return false;
        }
        return true;
    };

    return wrapChannel(target, {
        send(data) {
            return target.send({ ...data, from: myId });
        },
        on(name, callback) {
            return target.on(name, (data, fullPacket) => {
                const packetToCheck = name === '' ? data : fullPacket;
                if (packetToCheck && !isForMe(packetToCheck)) return;
                return callback(data, fullPacket);
            });
        },
    });
}

function withRecipient(target, to) {
    return wrapChannel(target, {
        send(data) {
            return target.send({ ...data, to });
        },
    });
}

function withLogger(target, prefix = 'NET') {
    return wrapChannel(target, {
        send(data) {
            console.log(`[${prefix} OUT]`, data);
            return target.send(data);
        },
        on(name, callback) {
            return target.on(name, (data, fullPacket) => {
                console.log(`[${prefix} IN:${name || 'root'}]`, data);
                return callback(data, fullPacket);
            });
        },
    });
}


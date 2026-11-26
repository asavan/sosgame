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

        // 1. Если есть подписчик на корень ("") — отдаем весь пакет ему
        const rootListener = listeners.get('');
        if (rootListener) {
            return Promise.resolve(rootListener(payload));
        }

        // 2. Иначе разбираем ключи по параллельным очередям
        const tasks = Object.entries(payload).map(([key, data]) =>
            enqueue(key, async () => {
                const listener = listeners.get(key);
                if (listener) await listener(data);

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

        // Подписываемся на транспорт через тот же единый интерфейс on("", cb)
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

            // Дочерний канал подключается к родителю через тот же интерфейс { send, on }
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
                api: childChannel,
                deliver: (data) => deliverToChild?.(data),
            });
        }
        return children.get(name).api;
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


// Обертка адресации (работает и с транспортом, и с каналом)
function withAddressing(target, myId) {
    return createChannel({
        send(data) {
            target.send({ ...data, from: myId });
        },
        on(name, callback) {
            if (name !== '') return;
            return target.on('', (payload) => {
                if (!payload || typeof payload !== 'object') return;
                if ('to' in payload && payload.to !== myId && payload.to !== 'all') return;
                return callback(payload);
            });
        },
    });
}

// Транспорт WebSocket
function wsTransport(ws) {
    return {
        send: (data) => {
            if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
        },
        on: (name, cb) => {
            if (name !== '') return;
            const listener = (e) => cb(JSON.parse(e.data));
            ws.addEventListener('message', listener);
            return () => ws.removeEventListener('message', listener);
        },
    };
}

// Фейковая сеть для тестов
function createFakeNetwork() {
    const peers = new Map();

    function getInstance(id) {
        let handler = null;
        peers.set(id, (packet) => handler?.(packet));

        return createChannel({
            send: (data) => {
                const packet = JSON.parse(JSON.stringify(data));
                Promise.resolve().then(() => {
                    for (const [peerId, peerReceive] of peers.entries()) {
                        if (peerId !== id) peerReceive(packet);
                    }
                });
            },
            on: (name, cb) => {
                if (name === '') {
                    handler = cb;
                    return () => { if (handler === cb) handler = null; };
                }
            },
        });
    }

    return { getInstance };
}

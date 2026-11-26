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

        // Если есть подписчик на корень ("") — отдаем весь пакет ему
        const rootListener = listeners.get('');
        if (rootListener) {
            return Promise.resolve(rootListener(payload));
        }

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

        if (transport.on) {
            unsubscribeTransport = transport.on('', (packet) => {
                handleIncoming(packet);
            });
        }
    }

    // Публичный объект api создаем заранее, чтобы внутренние методы
    // обращались к api.on и api.send (тогда их можно свободно переопределять снаружи!)
    const api = {
        connect,
        disconnect,

        send(data) {
            currentTransport?.send(data);
        },

        on(name, callback) {
            listeners.set(name, callback);
            return () => {
                if (listeners.get(name) === callback) listeners.delete(name);
            };
        },

        off(name) {
            listeners.delete(name);
        },

        waitOnce(name) {
            return new Promise((resolve) => {
                const unsubscribe = api.on(name, (data) => {
                    unsubscribe();
                    resolve(data);
                });
            });
        },

        onMap(map) {
            const unsubs = Object.entries(map).map(([name, cb]) => api.on(name, cb));
            return () => unsubs.forEach((fn) => fn());
        },

        channel(name) {
            if (!children.has(name)) {
                let deliverToChild = null;

                const childChannel = createChannel({
                    send: (data) => api.send({ [name]: data }),
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
        },
    };

    if (initialTransport) {
        connect(initialTransport);
    }

    return api;
}

function withAddressing(target, myId) {
    const isForMe = (payload) => {
        if (!payload || typeof payload !== 'object') return false;
        if ('to' in payload && payload.to !== myId && payload.to !== 'all') {
            return false;
        }
        return true;
    };

    return {
        ...target,

        send(data) {
            return target.send({ ...data, from: myId });
        },

        on(name, callback) {
            return target.on(name, (data, fullPacket) => {
                // Если подписка на корень (''), проверяем сам data (это и есть весь пакет)
                // Если подписка на ключ ('move'), проверяем fullPacket (если он передан)
                const packetToCheck = name === '' ? data : fullPacket;
                if (packetToCheck && !isForMe(packetToCheck)) return;

                return callback(data, fullPacket);
            });
        },
    };
}


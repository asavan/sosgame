function createChannel(initialTransport = null) {
    const listeners = new Map();
    const children = new Map();
    const queues = new Map();

    let currentTransport = null;
    let unsubscribeTransport = null;
    let nextLayerHandler = null;

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

        if (nextLayerHandler) {
            return Promise.resolve(nextLayerHandler(payload));
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

        if (transport.onMessage) {
            unsubscribeTransport = transport.onMessage((packet) => {
                handleIncoming(packet);
            });
        }
    }

    function send(data) {
        currentTransport?.send(data);
    }

    function onMessage(callback) {
        nextLayerHandler = callback;
        return () => {
            if (nextLayerHandler === callback) nextLayerHandler = null;
        };
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

    function onMap(map) {
        const unsubs = Object.entries(map).map(([name, cb]) => on(name, cb));
        return () => unsubs.forEach((fn) => fn());
    }

    function channel(name) {
        if (!children.has(name)) {
            let deliverToChild = null;

            const childChannel = createChannel({
                send: (data) => send({ [name]: data }),
                onMessage: (cb) => {
                    deliverToChild = cb;
                    return () => { deliverToChild = null; };
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
        onMap,
        channel,
        send,
        onMessage,
    };
}

function cachableChannel(channel) {
    const outbox = [];
    let realTransport = null;
    let unsubscribeReal = null;
    let deliverToChannel = null;

    // Подключаем внутренний канал к прокси-транспорту один раз при создании
    channel.connect({
        send(data) {
            if (realTransport) {
                realTransport.send(data);
            } else {
                outbox.push(data);
            }
        },
        onMessage(cb) {
            deliverToChannel = cb;
            return () => { deliverToChannel = null; };
        },
    });

    function disconnect() {
        if (unsubscribeReal) {
            unsubscribeReal();
            unsubscribeReal = null;
        }
        realTransport = null;
    }

    function connect(transport) {
        disconnect();
        if (!transport) return;

        realTransport = transport;

        if (transport.onMessage) {
            unsubscribeReal = transport.onMessage((packet) => {
                deliverToChannel?.(packet);
            });
        }

        // Отправляем всё накопленное в новый транспорт
        while (outbox.length > 0 && realTransport) {
            realTransport.send(outbox.shift());
        }
    }

    return {
        ...channel,
        connect,
        disconnect,
    };
}

// Создаем канал с буферизацией (если не нужна — просто вызываем createChannel())
const gameChannel = cachableChannel(createChannel());

const round = gameChannel.channel('game').channel('round');
round.on('move', (step) => console.log('Ход:', step));

// Сети еще нет — сообщение попадает в outbox
round.send({ ready: true });

// Подключаем транспорт или другой канал — буфер сразу улетает в сеть
gameChannel.connect(withAddressing(wsTransport(ws), 'player_0'));

// При обрыве связи снова включается режим накопления
gameChannel.disconnect();
round.send({ ping: 1 }); // Снова сохранится в outbox до следующего connect()



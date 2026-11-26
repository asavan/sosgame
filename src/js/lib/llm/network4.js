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

    function waitOnce(name) {
        return new Promise((resolve) => {
            const unsubscribe = on(name, (data) => {
                unsubscribe();
                resolve(data);
            });
        });
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
        waitOnce,
        onMessage,
    };
}

// Добавляет { from: myId } и фильтрует входящие по `to`
function withAddressing(target, myId) {
    return {
        ...target,
        send(data) {
            return target.send({ ...data, from: myId });
        },
        onMessage(callback) {
            return target.onMessage((payload) => {
                if (!payload || typeof payload !== 'object') return;
                if ('to' in payload && payload.to !== myId && payload.to !== 'all') {
                    return;
                }
                return callback(payload);
            });
        },
    };
}

// Добавляет { to } к исходящим сообщениям
function withRecipient(target, to) {
    return {
        ...target,
        send(data) {
            return target.send({ ...data, to });
        },
    };
}

function wsTransport(ws) {
    return {
        send: (data) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(data));
            }
        },
        onMessage: (cb) => {
            const listener = (e) => cb(JSON.parse(e.data));
            ws.addEventListener('message', listener);
            return () => ws.removeEventListener('message', listener);
        },
    };
}

function createFakeNetwork() {
    const peers = new Map();

    function getTransport(id) {
        let handler = null;
        peers.set(id, (packet) => handler?.(packet));

        return {
            send: (data) => {
                const packet = JSON.parse(JSON.stringify(data));
                Promise.resolve().then(() => {
                    for (const [peerId, peerReceive] of peers.entries()) {
                        if (peerId !== id) peerReceive(packet);
                    }
                });
            },
            onMessage: (cb) => {
                handler = cb;
                return () => { if (handler === cb) handler = null; };
            },
        };
    }

    return { getTransport };
}

// 1. Создаем пустой канал и настраиваем всю игру до появления сети
const root = createChannel();
const round = root.channel('game').channel('round');

round.onMap({
    async move(step) {
        console.log('Ход:', step);
    },
    async end() {
        console.log('Конец раунда');
    },
});

// 2. Подключаем транспорт (в тесте — фейковый, в игре — WebSocket)
const fakeNet = createFakeNetwork();
root.connect(withAddressing(fakeNet.getTransport(0), 'player_0'));

// 3. При обрыве сети просто переподключаем на новый сокет, подписки остаются
// root.disconnect();
// root.connect(withAddressing(wsTransport(newWs), 'player_0'));

const rootChan = createChannel(transport);

// 1. Сначала начинаем ждать ответ, затем отправляем запрос
const welcomePromise = rootChan.waitOnce('welcome');
rootChan.send({ join: myId });

const serverReply = await welcomePromise;
console.log('Ответ сервера:', serverReply);

// 2. Работает точно так же и на любом вложенном подканале
const round = rootChan.channel('game').channel('round');
const startData = await round.waitOnce('start');

function withAddressing(target, myId) {
    return createChannel({
        send(data) {
            target.send({ ...data, from: myId });
        },
        onMessage(callback) {
            return target.onMessage((payload) => {
                if (!payload || typeof payload !== 'object') return;
                if ('to' in payload && payload.to !== myId && payload.to !== 'all') {
                    return;
                }
                return callback(payload);
            });
        },
    });
}

function withRecipient(target, to) {
    return createChannel({
        send(data) {
            target.send({ ...data, to });
        },
        onMessage(callback) {
            return target.onMessage(callback);
        },
    });
}

// ==========================================
// 1. Базовый иерархический канал
// ==========================================
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

        // Если есть подписчик на корень (''), передаем весь пакет целиком
        const rootListener = listeners.get('');
        if (rootListener) {
            return Promise.resolve(rootListener(payload));
        }

        // Разбираем ключи по параллельным очередям промисов
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
                        return () => {
                            deliverToChild = null;
                        };
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

// ==========================================
// 2. Помощник для создания оберток (Middleware)
// ==========================================
function wrapChannel(target, { send = target.send, on = target.on } = {}) {
    // Если передан сырой транспорт без методов канала
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

// ==========================================
// 3. Готовые обертки
// ==========================================

// Добавляет { from: myId } на отправку и фильтрует входящие по `to`
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

// Добавляет { to } ко всем исходящим сообщениям
function withRecipient(target, to) {
    return wrapChannel(target, {
        send(data) {
            return target.send({ ...data, to });
        },
    });
}

// ==========================================
// 4. Транспорты (WebSocket и Фейковая сеть)
// ==========================================

function wsTransport(ws) {
    return {
        send: (data) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(data));
            }
        },
        on: (name, cb) => {
            if (name !== '') return;
            const listener = (e) => cb(JSON.parse(e.data));
            ws.addEventListener('message', listener);
            return () => ws.removeEventListener('message', listener);
        },
    };
}

function webrtcTransport(dataChannel) {
    return {
        send: (data) => {
            if (dataChannel.readyState === 'open') {
                dataChannel.send(JSON.stringify(data));
            }
        },
        on: (name, cb) => {
            if (name !== '') return;

            const listener = (event) => {
                try {
                    const parsed = JSON.parse(event.data);
                    cb(parsed);
                } catch (err) {
                    console.error('[WebRTC Transport parse error]:', err);
                }
            };

            dataChannel.addEventListener('message', listener);
            return () => dataChannel.removeEventListener('message', listener);
        },
    };
}

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
                    return () => {
                        if (handler === cb) handler = null;
                    };
                }
            },
        });
    }

    return { getInstance };
}

// ==========================================
// 5. Пример использования
// ==========================================
async function example() {
    const fakeNet = createFakeNetwork();

    // Создаем каналы для двух игроков с адресацией
    const p0 = withAddressing(fakeNet.getInstance(0), 'player_0');
    const p1 = withAddressing(fakeNet.getInstance(1), 'player_1');

    // Подписываемся на вложенный подканал раунда у второго игрока
    const roundP1 = p1.channel('game').channel('round');
    roundP1.onMap({
        async move(step) {
            console.log('Игрок 1 получил ход:', step);
        },
    });

    // Игрок 1 ждет одноразовое сообщение 'welcome'
    const welcomePromise = p1.waitOnce('welcome');

    // Игрок 0 отправляет личное сообщение игроку 1
    const directToP1 = withRecipient(p0, 'player_1');
    directToP1.send({ welcome: { room: 'alpha' } });
    directToP1.channel('game').channel('round').send({ move: 15 });

    const welcomeData = await welcomePromise;
    console.log('Игрок 1 дождался welcome:', welcomeData);
}

const gameChannel = createChannel();

// 1. Сначала работаем через сервер (с адресацией)
gameChannel.connect(withAddressing(wsTransport(ws), 'player_0'));

// 2. Когда WebRTC DataChannel открылся — переключаемся на прямое P2P-соединение
dataChan.addEventListener('open', () => {
    gameChannel.connect(webrtcTransport(dataChan));
});

// 3. Если P2P-соединение порвалось — можно откатиться обратно на сервер
dataChan.addEventListener('close', () => {
    gameChannel.connect(withAddressing(wsTransport(ws), 'player_0'));
});

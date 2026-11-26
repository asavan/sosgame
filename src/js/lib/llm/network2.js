function createChannel(transport) {
    const listeners = new Map();
    const children = new Map();
    const queues = new Map();
    let nextLayerHandler = null;

    // Очередь последовательного выполнения для конкретного ключа
    function enqueue(key, task) {
        const prev = queues.get(key) || Promise.resolve();
        const next = prev
            .then(() => task())
            .catch((err) => console.error(`[Channel error "${key}"]:`, err));
        queues.set(key, next);
        return next;
    }

    // Внутренняя функция обработки входящего объекта (снаружи не видна)
    function handleIncoming(payload) {
        if (!payload || typeof payload !== 'object') return Promise.resolve();

        // 1. Если поверх этого канала надет другой слой (через onMessage), отдаем пакет ему
        if (nextLayerHandler) {
            return Promise.resolve(nextLayerHandler(payload));
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

    // Подписываемся на входящий поток транспорта
    transport?.onMessage((packet) => handleIncoming(packet));

    // --- Публичный API ---

    function send(data) {
        transport?.send(data);
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

            // Дочерний канал создается точно так же, как корневой — через { send, onMessage }
            const childChannel = createChannel({
                send: (data) => send({ [name]: data }),
                onMessage: (cb) => { deliverToChild = cb; },
            });

            children.set(name, {
                api: childChannel,
                deliver: (data) => deliverToChild?.(data),
            });
        }
        return children.get(name).api;
    }

    return { send, onMessage, on, off, onMap, channel };
}

function withAddressing(target, myId) {
    return {
        // Сохраняем все методы, если target — это канал (on, off, onMap, channel)
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

function withRecipient(target, to) {
    return {
        ...target,

        send(data) {
            return target.send({ ...data, to });
        },
    };
}



// Реальный WebSocket
function wsTransport(ws) {
    return {
        send: (data) => {
            if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
        },
        onMessage: (cb) => {
            ws.addEventListener('message', (e) => cb(JSON.parse(e.data)));
        },
    };
}

// Фейковая сеть для тестов
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
            },
        };
    }

    return { getTransport };
}

// 1. Берем транспорт (в тесте — фейковый, в бою — wsTransport(ws))
const fakeNet = createFakeNetwork();
const rawTransport0 = fakeNet.getTransport(0);
const rawTransport1 = fakeNet.getTransport(1);

// 2. Оборачиваем в адресацию и создаем корневые каналы
const player0 = createChannel(withAddressing(rawTransport0, 'p0'));
const player1 = createChannel(withAddressing(rawTransport1, 'p1'));

// 3. Работаем с иерархией (очереди работают автоматически)
const round1 = player1.channel('game').channel('round');

round1.onMap({
    async move(step) {
        console.log('Игрок 1 получил ход:', step);
    },
    async end() {
        console.log('Раунд завершен');
    }
});

// 4. Отправляем сообщение от player0 только для player1
player0.send({
    to: 'p1',
    game: { round: { move: 15 } }
});


function createSwitchableTransport(initialTransport = null) {
    let currentTransport = null;
    let unsubscribeCurrent = null;
    let messageHandler = null;
    const outbox = []; // Буфер для сообщений, отправленных до подключения

    function connect(newTransport) {
        // 1. Отписываемся от старого транспорта, если он был
        if (unsubscribeCurrent) {
            unsubscribeCurrent();
            unsubscribeCurrent = null;
        }

        currentTransport = newTransport;

        // 2. Подключаем входящий поток нового транспорта
        if (currentTransport?.onMessage) {
            unsubscribeCurrent = currentTransport.onMessage((packet) => {
                messageHandler?.(packet);
            });
        }

        // 3. Если в буфере накопились сообщения до подключения — отправляем их
        if (currentTransport && outbox.length > 0) {
            while (outbox.length > 0) {
                currentTransport.send(outbox.shift());
            }
        }
    }

    function disconnect() {
        connect(null);
    }

    function send(data) {
        if (currentTransport) {
            currentTransport.send(data);
        } else {
            // Пока сети нет, складываем в буфер (при желании можно ограничить размер)
            outbox.push(data);
        }
    }

    function onMessage(callback) {
        messageHandler = callback;
        return () => {
            if (messageHandler === callback) messageHandler = null;
        };
    }

    // Если начальный транспорт передали сразу — подключаем его
    if (initialTransport) {
        connect(initialTransport);
    }

    return {
        // Стандартный интерфейс транспорта
        send,
        onMessage,
        // Управление подключением
        connect,
        disconnect,
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
            // Возвращаем функцию очистки при переподключении
            return () => ws.removeEventListener('message', listener);
        },
    };
}



// 1. Создаем пустой шлюз (сети еще вообще нет!)
const networkGateway = createSwitchableTransport();

// 2. Оборачиваем в адресацию и отдаем в игру
const gameChannel = createChannel(withAddressing(networkGateway, 'player_0'));

// Игра спокойно настраивает все свои подписки до появления сети
gameChannel.channel('game').channel('round').on('move', (step) => {
    console.log('Ход получен:', step);
});

// Если игра отправит что-то прямо сейчас, пакет подождет в outbox
gameChannel.channel('game').send({ status: 'ready' });

// 3. Позже появился первый WebSocket — подключаем!
// Пакет { status: 'ready' } сразу улетит в сокет
const ws1 = new WebSocket('wss://://example.com');
ws1.addEventListener('open', () => {
    networkGateway.connect(wsTransport(ws1));
});

// 4. Сокет порвался -> открываем новый и переподключаем шлюз
ws1.addEventListener('close', () => {
    networkGateway.disconnect(); // Ставим входящий/исходящий поток на паузу

    const ws2 = new WebSocket('wss://://example.com');
    ws2.addEventListener('open', () => {
        // Просто подменяем транспорт. Вся логика игры и подписки работают как ни в чём не бывало!
        networkGateway.connect(wsTransport(ws2));
    });
});


function createChannel5(initialTransport = null) {
    const listeners = new Map();
    const children = new Map();
    const queues = new Map();

    let currentTransport = null;
    let unsubscribeTransport = null;
    let nextLayerHandler = null;
    const outbox = []; // Буфер сообщений до подключения транспорта

    // Последовательная очередь для каждого ключа
    function enqueue(key, task) {
        const prev = queues.get(key) || Promise.resolve();
        const next = prev
            .then(() => task())
            .catch((err) => console.error(`[Channel error "${key}"]:`, err));
        queues.set(key, next);
        return next;
    }

    // Внутренняя обработка входящего пакета
    function handleIncoming(payload) {
        if (!payload || typeof payload !== 'object') return Promise.resolve();

        // Если поверх канала надет другой слой (через onMessage), отдаем пакет ему
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

    // --- Управление подключением к транспорту/каналу ---

    function disconnect() {
        if (unsubscribeTransport) {
            unsubscribeTransport();
            unsubscribeTransport = null;
        }
        currentTransport = null;
    }

    function connect(transport) {
        disconnect(); // Сначала отписываемся от старого транспорта, если он был

        if (!transport) return;
        currentTransport = transport;

        // Подписываемся на входящий поток нового транспорта/канала
        if (transport.onMessage) {
            unsubscribeTransport = transport.onMessage((packet) => {
                handleIncoming(packet);
            });
        }

        // Отправляем всё, что накопилось в буфере, пока канал был отключен
        while (outbox.length > 0 && currentTransport) {
            currentTransport.send(outbox.shift());
        }
    }

    // --- Отправка и маршрутизация ---

    function send(data) {
        if (currentTransport) {
            currentTransport.send(data);
        } else {
            outbox.push(data);
        }
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

    // Если транспорт передали сразу при создании — подключаем
    if (initialTransport) {
        connect(initialTransport);
    }

    return {
        // Работа с сетью
        connect,
        disconnect,
        // Интерфейс канала
        on,
        off,
        onMap,
        channel,
        // Интерфейс транспорта (чтобы этот канал можно было подключить к другому каналу)
        send,
        onMessage,
    };
}

// 1. Создаем пустой канал без сети и отдаем его в игру
const gameChannel = createChannel();

// Игра сразу настраивает всю свою логику и подписки
const round = gameChannel.channel('game').channel('round');
round.onMap({
    async move(step) {
        console.log('Игрок сходил:', step);
    },
    async end(winner) {
        console.log('Победитель:', winner);
    },
});

// Даже если игра отправит сообщение сейчас, оно не потеряется, а подождет подключения
round.send({ ready: true });

// 2. Позже поднимается WebSocket — подключаем его (можно сразу с оберткой адресации)
const ws1 = new WebSocket('wss://://example.com');
ws1.addEventListener('open', () => {
    gameChannel.connect(withAddressing(wsTransport(ws1), 'player_0'));
    // В этот момент { game: { round: { ready: true } }, from: 'player_0' } сразу улетит в сокет!
});

// 3. Сокет порвался -> отключаемся и при появлении нового сокета просто переподключаемся
ws1.addEventListener('close', () => {
    gameChannel.disconnect();

    const ws2 = new WebSocket('wss://://example.com');
    ws2.addEventListener('open', () => {
        gameChannel.connect(withAddressing(wsTransport(ws2), 'player_0'));
    });
});

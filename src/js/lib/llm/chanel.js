function createChannel(sender = null) {
    const listeners = new Map();
    const children = new Map();
    const queues = new Map();

    // Ставит задачу в последовательную очередь для конкретного ключа
    function enqueue(key, task) {
        const prev = queues.get(key) || Promise.resolve();

        const next = prev
            .then(() => task())
            .catch((err) => {
                console.error(`[Channel error on "${key}"]:`, err);
            });

        queues.set(key, next);
        return next;
    }

    function off(name, callback) {
        listeners.get(name)?.delete(callback);
    }

    function on(name, callback) {
        if (!listeners.has(name)) {
            listeners.set(name, new Set());
        }
        listeners.get(name).add(callback);

        return () => off(name, callback);
    }

    function onMap(handlersMap) {
        const unsubs = Object.entries(handlersMap).map(([name, cb]) =>
            on(name, cb)
        );
        return () => unsubs.forEach((unsub) => unsub());
    }

    function send(data) {
        if (sender) {
            sender(data);
        }
    }

    function channel(name) {
        if (!children.has(name)) {
            // Создаём вложенный канал, который при отправке заворачивает данные в свой ключ
            const child = createChannel((data) => send({ [name]: data }));
            children.set(name, child);
        }
        return children.get(name);
    }

    // Возвращает промис, который зарезолвится, когда отработают все ветки этого пакета
    function receive(payload) {
        if (!payload || typeof payload !== 'object') {
            return Promise.resolve();
        }

        const tasks = Object.entries(payload).map(([key, data]) =>
            enqueue(key, async () => {
                // 1. Сначала отрабатывают прямые подписчики на этот ключ
                const keyListeners = listeners.get(key);
                if (keyListeners) {
                    for (const cb of keyListeners) {
                        await cb(data);
                    }
                }

                // 2. Затем данные уходят в дочерний канал (если на него подписались)
                const child = children.get(key);
                if (child) {
                    await child.receive(data);
                }
            })
        );

        return Promise.all(tasks);
    }

    return {
        on,
        off,
        onMap,
        channel,
        send,
        receive,
    };
}


function createWsChannel(ws) {
    const root = createChannel((data) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    });

    ws.addEventListener('message', (event) => {
        root.receive(JSON.parse(event.data));
    });

    return root;
}

function createRtcChannel(dataChannel) {
    const root = createChannel((data) => {
        if (dataChannel.readyState === 'open') {
            dataChannel.send(JSON.stringify(data));
        }
    });

    dataChannel.addEventListener('message', (event) => {
        root.receive(JSON.parse(event.data));
    });

    return root;
}

const connection = createWsChannel(socket);

// Слушаем системные события верхнего уровня (параллельно с игрой)
connection.on('network', async (info) => {
    console.log('Ping:', info.ping);
});

// Получаем подканал раунда (можно цепочкой)
const round = connection.channel('game').channel('round');

// Модуль раунда работает с `round` как с самостоятельным каналом
function setupRound(roundChannel) {
    const unsubscribe = roundChannel.onMap({
        async move(step) {
            await playMoveAnimation(step); // Ждем завершения анимации
            console.log('Игрок сходил на:', step);
        },
        async finish(winner) {
            console.log('Победитель:', winner);
        },
    });

    // Отправка из глубины: автоматически улетит как { game: { round: { ready: true } } }
    roundChannel.send({ ready: true });

    return unsubscribe;
}

setupRound(round);

function createFakeNetwork() {
    // Храним каналы участников: Map<participantId, Channel>
    const peers = new Map();

    function getInstance(id) {
        // Если канал для этого участника уже создан, возвращаем его
        if (peers.has(id)) {
            return peers.get(id);
        }

        // Создаём новый канал с кастомным отправителем
        const channel = createChannel((data) => {
            // Клонируем данные, чтобы имитировать передачу по сети (сериализацию)
            // и предотвратить баги с общими ссылками на объекты в памяти
            const packet = JSON.parse(JSON.stringify(data));

            // Имитируем асинхронность сети через микротаску (Promise.resolve)
            Promise.resolve().then(() => {
                for (const [peerId, peerChannel] of peers.entries()) {
                    // Отправляем всем, кроме самого отправителя
                    if (peerId !== id) {
                        peerChannel.receive(packet);
                    }
                }
            });
        });

        peers.set(id, channel);
        return channel;
    }

    return {
        getInstance,
    };
}

const fakeNetwork = createFakeNetwork();

// Вариант А: тестируем изолированно только модуль раунда
const chan1 = fakeNetwork.getInstance(0);
const chan2 = fakeNetwork.getInstance(1);

setupRound(chan1);
setupRound(chan2);

// chan1 отправляет { ready: true }, chan2 получит это в свой обработчик on('ready')
chan1.send({ ready: true });


// Вариант Б: интеграционный тест с полной иерархией
const player1 = fakeNetwork.getInstance(0);
const player2 = fakeNetwork.getInstance(1);

setupRound(player1.channel('game').channel('round'));
setupRound(player2.channel('game').channel('round'));

// player1 отправит { game: { round: { move: 15 } } },
// а у player2 сработает подписка внутри round!
player1.channel('game').channel('round').send({ move: 15 });

function createChannel2(sender = null) {
    // Теперь храним строго один callback на одно имя: Map<eventName, Function>
    const listeners = new Map();
    const children = new Map();
    const queues = new Map();

    function enqueue(key, task) {
        const prev = queues.get(key) || Promise.resolve();

        const next = prev
            .then(() => task())
            .catch((err) => {
                console.error(`[Channel error on "${key}"]:`, err);
            });

        queues.set(key, next);
        return next;
    }

    function off(name) {
        listeners.delete(name);
    }

    function on(name, callback) {
        // Просто перезаписываем старый обработчик новым
        listeners.set(name, callback);

        // Функция отписки удалит обработчик, только если он не был перезаписан другим
        return () => {
            if (listeners.get(name) === callback) {
                listeners.delete(name);
            }
        };
    }

    function onMap(handlersMap) {
        const unsubs = Object.entries(handlersMap).map(([name, cb]) =>
            on(name, cb)
        );
        return () => unsubs.forEach((unsub) => unsub());
    }

    function send(data) {
        if (sender) {
            sender(data);
        }
    }

    function channel(name) {
        if (!children.has(name)) {
            const child = createChannel2((data) => send({ [name]: data }));
            children.set(name, child);
        }
        return children.get(name);
    }

    function receive(payload) {
        if (!payload || typeof payload !== 'object') {
            return Promise.resolve();
        }

        const tasks = Object.entries(payload).map(([key, data]) =>
            enqueue(key, async () => {
                // 1. Вызываем единственный обработчик для этого ключа (если он есть)
                const listener = listeners.get(key);
                if (listener) {
                    await listener(data);
                }

                // 2. Прокидываем данные в дочерний канал
                const child = children.get(key);
                if (child) {
                    await child.receive(data);
                }
            })
        );

        return Promise.all(tasks);
    }

    return {
        on,
        off,
        onMap,
        channel,
        send,
        receive,
    };
}


function createChannel3(sender = null) {
    const listeners = new Map();
    const children = new Map();
    const queues = new Map();

    function enqueue(key, task) {
        const prev = queues.get(key) || Promise.resolve();
        const next = prev
            .then(() => task())
            .catch((err) => console.error(`[Channel error on "${key}"]:`, err));
        queues.set(key, next);
        return next;
    }

    function off(name) {
        listeners.delete(name);
    }

    function on(name, callback) {
        listeners.set(name, callback);
        return () => {
            if (listeners.get(name) === callback) {
                listeners.delete(name);
            }
        };
    }

    function onMap(handlersMap) {
        const unsubs = Object.entries(handlersMap).map(([name, cb]) =>
            on(name, cb)
        );
        return () => unsubs.forEach((unsub) => unsub());
    }

    function send(data) {
        if (sender) sender(data);
    }

    function channel(name) {
        if (!children.has(name)) {
            const child = createChannel3((data) => send({ [name]: data }));
            children.set(name, child);
        }
        return children.get(name);
    }

    function receive(payload) {
        if (!payload || typeof payload !== 'object') {
            return Promise.resolve();
        }

        const tasks = Object.entries(payload).map(([key, data]) =>
            enqueue(key, async () => {
                const listener = listeners.get(key);
                if (listener) {
                    // Передаем data и весь текущий объект payload как контекст
                    await listener(data, payload);
                }

                const child = children.get(key);
                if (child) {
                    await child.receive(data);
                }
            })
        );

        return Promise.all(tasks);
    }

    return { on, off, onMap, channel, send, receive };
}

function withAddressing(baseChannel, myId) {
    const inner = createChannel((data) => {
        baseChannel.send({
            ...data,
            from: myId,
        });
    });

    // Вспомогательная функция: подписывает baseChannel на ключ ровно один раз,
    // когда кто-то извне начинает слушать этот ключ через обертку
    const bridgedKeys = new Set();
    function bridgeKey(key) {
        if (bridgedKeys.has(key)) return;
        bridgedKeys.add(key);

        baseChannel.on(key, (data, fullPacket) => {
            // Проверяем поле `to` в полном пакете, если оно есть
            if ('to' in fullPacket && fullPacket.to !== myId && fullPacket.to !== 'all') {
                return; // Пропускаем чужое сообщение
            }
            // Прокидываем только полезную нагрузку в inner
            return inner.receive({ [key]: data });
        });
    }

    // Возвращаем интерфейс канала, перехватывая регистрацию ключей
    return {
        on(name, callback) {
            bridgeKey(name);
            return inner.on(name, callback);
        },
        onMap(handlersMap) {
            Object.keys(handlersMap).forEach(bridgeKey);
            return inner.onMap(handlersMap);
        },
        channel(name) {
            bridgeKey(name);
            return inner.channel(name);
        },
        off: inner.off,
        send: inner.send,
        receive: inner.receive,
    };
}

function withAddressing(channel, myId) {
    // Сохраняем оригинальные методы
    const originalSend = channel.send;
    const originalReceive = channel.receive;

    // Переопределяем send: добавляем from
    channel.send = (data) => {
        return originalSend({
            ...data,
            from: myId,
        });
    };

    // Переопределяем receive: проверяем to
    channel.receive = (payload) => {
        if (!payload || typeof payload !== 'object') {
            return Promise.resolve();
        }

        // Если есть поле `to` и оно не для нас — игнорируем весь пакет
        if ('to' in payload && payload.to !== myId && payload.to !== 'all') {
            return Promise.resolve();
        }

        // Вызываем оригинальный receive
        return originalReceive(payload);
    };

    return channel;
}

function createChannel4(transport = null) {
    const listeners = new Map();
    const children = new Map();
    const queues = new Map();
    let messageHandler = null;

    function enqueue(key, task) {
        const prev = queues.get(key) || Promise.resolve();
        const next = prev
            .then(() => task())
            .catch((err) => console.error(`[Channel error on "${key}"]:`, err));
        queues.set(key, next);
        return next;
    }

    function receive(payload) {
        if (!payload || typeof payload !== 'object') {
            return Promise.resolve();
        }

        // Если кто-то слушает этот канал целиком как транспорт через onMessage
        const rawTask = messageHandler ? messageHandler(payload) : null;

        // Разбираем ключи по параллельным очередям
        const keyTasks = Object.entries(payload).map(([key, data]) =>
            enqueue(key, async () => {
                const listener = listeners.get(key);
                if (listener) {
                    await listener(data);
                }

                const child = children.get(key);
                if (child) {
                    await child.push(data);
                }
            })
        );

        return Promise.all([rawTask, ...keyTasks]);
    }

    // Подключаемся к входящему потоку переданного транспорта
    if (transport?.onMessage) {
        transport.onMessage((packet) => receive(packet));
    }

    function send(data) {
        transport?.send?.(data);
    }

    function onMessage(callback) {
        messageHandler = callback;
        return () => {
            if (messageHandler === callback) messageHandler = null;
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

    function onMap(handlersMap) {
        const unsubs = Object.entries(handlersMap).map(([name, cb]) =>
            on(name, cb)
        );
        return () => unsubs.forEach((unsub) => unsub());
    }

    function channel(name) {
        if (!children.has(name)) {
            let pushToChild = null;

            // Создаем дочерний канал, передав ему виртуальный транспорт { send, onMessage }
            const child = createChannel({
                send: (data) => send({ [name]: data }),
                onMessage: (cb) => {
                    pushToChild = cb;
                },
            });

            children.set(name, {
                instance: child,
                push: (data) => pushToChild?.(data),
            });
        }
        return children.get(name).instance;
    }

    return {
        // Интерфейс канала
        on,
        off,
        onMap,
        channel,
        // Интерфейс транспорта (совпадает с любым WS / WebRTC / FakeNetwork)
        send,
        onMessage,
    };
}

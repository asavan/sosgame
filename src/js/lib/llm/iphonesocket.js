async function connectWebSocketWithIosFix(port, path = "", { maxRetries = 5, retryDelay = 300, connectTimeout = 2000 } = {}) {
    const host = window.location.hostname;
    const wsUrl = `ws://${host}:${port}${path}`;

    // 1. "Будим" порт для iOS с жестким таймаутом (чтобы fetch не висел вечно)
    const controller = new AbortController();
    const warmupTimeout = setTimeout(() => controller.abort(), 1000);
    try {
        await fetch(`http://${host}:${port}${path}`, {
            mode: "no-cors",
            cache: "no-store",
            signal: controller.signal
        });
    } catch (e) {
        // Игнорируем ошибку — нам важно было только пнуть сетевой стек iOS
    } finally {
        clearTimeout(warmupTimeout);
    }

    // Небольшая пауза, чтобы демон nehelper в iOS применил правило маршрутизации
    await new Promise(r => setTimeout(r, 150));

    // 2. Цикл попыток подключения с жестким лимитом
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const ws = await trySingleConnect(wsUrl, connectTimeout);
            return ws; // Успешно подключились — выходим из функции
        } catch (err) {
            console.warn(`Попытка ${attempt}/${maxRetries} не удалась:`, err.message);

            // Если исчерпали все попытки — пробрасываем ошибку наверх
            if (attempt === maxRetries) {
                throw new Error(`Не удалось подключиться к ${wsUrl} после ${maxRetries} попыток`);
            }

            // Ждем перед следующей попыткой (можно увеличивать задержку: retryDelay * attempt)
            await new Promise(r => setTimeout(r, retryDelay * attempt));
        }
    }
}

// Вспомогательная функция для одной изолированной попытки с таймаутом
function trySingleConnect(url, timeoutMs) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(url);
        let settled = false;

        const timer = setTimeout(() => {
            if (!settled) {
                settled = true;
                ws.close();
                reject(new Error("Таймаут подключения"));
            }
        }, timeoutMs);

        ws.onopen = () => {
            if (!settled) {
                settled = true;
                clearTimeout(timer);
                resolve(ws);
            }
        };

        ws.onerror = () => {
            if (!settled) {
                settled = true;
                clearTimeout(timer);
                ws.close();
                reject(new Error("Ошибка WebSocket"));
            }
        };

        ws.onclose = (e) => {
            if (!settled) {
                settled = true;
                clearTimeout(timer);
                reject(new Error(`Сокет закрыт (code: ${e.code})`));
            }
        };
    });
}

const log = (msg) => {
    document.body.innerHTML += `<div>${new Date().toISOString().slice(11, 23)}: ${msg}</div>`;
};

const ws = new WebSocket(`ws://${location.hostname}:ВАШ_ПОРТ`);

ws.onopen = () => log("OPEN");
ws.onerror = (e) => log("ERROR: " + JSON.stringify(e));
ws.onclose = (e) => log(`CLOSE: code=${e.code}, reason=${e.reason}, clean=${e.wasClean}`);


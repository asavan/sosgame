async function connectWebSocketWithIosFix(port, path = "") {
    const host = window.location.hostname;
    const wsUrl = `ws://${host}:${port}${path}`;

    // 1. "Будим" разрешение iOS для другого порта через обычный HTTP-запрос.
    // Нам не важен статус ответа (даже если WS-сервер ответит ошибкой 400/426 Upgrade Required),
    // главное — заставить iOS открыть маршрут к этому порту.
    try {
        await fetch(`http://${host}:${port}${path}`, { mode: "no-cors", cache: "no-store" });
    } catch (e) {
        // Игнорируем ошибку, маршрут в ядре iOS уже инициирован
    }

    // 2. Даем сетевому демону iOS 150 мс на применение правила и открываем сокет
    return new Promise((resolve) => {
        const attempt = () => {
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => resolve(ws);

            ws.onclose = () => {
                // Если первый SYN все же отбросился — повторяем через 300 мс (на второй раз iOS пропустит)
                setTimeout(attempt, 300);
            };

            ws.onerror = () => ws.close();
        };

        setTimeout(attempt, 150);
    });
}

// Использование:
connectWebSocketWithIosFix(8080).then((ws) => {
    console.log("Сокет на другом порту подключен!", ws);
});

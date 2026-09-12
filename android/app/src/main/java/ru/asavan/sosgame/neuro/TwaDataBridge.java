package ru.asavan.sosgame.neuro;

import android.util.Base64;
import androidx.browser.customtabs.CustomTabsSession;
import org.json.JSONObject;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

public class TwaDataBridge {

    private final CustomTabsSession customTabsSession;
    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();
    private final boolean isChannelReady;

    private static class CacheEntry {
        final CountDownLatch latch = new CountDownLatch(1);
        final AtomicBoolean isRequestSent = new AtomicBoolean(false);
        volatile byte[] data = null;
    }

    /**
     * Конструктор принимает сессию и текущий статус готовности канала портов.
     */
    public TwaDataBridge(CustomTabsSession session, boolean isChannelReady) {
        this.customTabsSession = session;
        this.isChannelReady = isChannelReady;
    }

    /**
     * Синхронный метод получения данных по ключу.
     * Не вызывайте в главном (UI) потоке приложения.
     */
    public byte[] getData(String key) {
        if (customTabsSession == null || !isChannelReady) {
            return null;
        }

        // Атомарно получаем или создаем запись для ключа
        CacheEntry entry = cache.computeIfAbsent(key, k -> new CacheEntry());

        // Первый зашедший поток отправляет запрос на веб-страницу
        boolean isFirstRequest = entry.isRequestSent.compareAndSet(false, true);

        try {
            if (isFirstRequest) {
                JSONObject message = new JSONObject();
                message.put("file", key);
                customTabsSession.postMessage(message.toString(), null);
            }

            // Блокируем поток на время ожидания ответа (таймаут 15 секунд)
            boolean success = entry.latch.await(15, TimeUnit.SECONDS);
            if (success && entry.data != null) {
                return entry.data;
            }

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            // Если мы были инициатором запроса, но данные по какой-то причине не пришли
            // (ошибка JSON, таймаут, InterruptedException), очищаем запись из кэша,
            // чтобы дать возможность повторить запрос при следующем вызове.
            if (isFirstRequest && entry.data == null) {
                cache.remove(key);
            }
        }
        return null;
    }

    /**
     * Публичный метод для обработки входящих JSON-сообщений.
     * Вызывается внешним посредником (например, из Activity через Callback).
     */
    public void processIncomingMessage(String messageString) {
        try {
            JSONObject response = new JSONObject(messageString);
            if (!response.has("file")) return;
            String key = response.getString("file");

            CacheEntry entry = cache.get(key);
            if (entry != null && response.has("data")) {
                // Записываем данные только один раз
                if (entry.data == null) {
                    String base64Data = response.getString("data");
                    entry.data = Base64.decode(base64Data, Base64.DEFAULT);
                }
                // Разблокируем все ожидающие этот ключ потоки
                entry.latch.countDown();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * Полная очистка внутреннего кэша.
     */
    public void clearCache() {
        cache.clear();
    }
}

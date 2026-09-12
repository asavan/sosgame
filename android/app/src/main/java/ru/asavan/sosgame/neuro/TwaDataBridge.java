package ru.asavan.sosgame.neuro;

import android.util.Base64;
import org.json.JSONObject;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

public class TwaDataBridge {

    private final TwaMessageBridgeCallback messageCallback;
    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

    private static class CacheEntry {
        final CountDownLatch latch = new CountDownLatch(1);
        final AtomicBoolean isRequestSent = new AtomicBoolean(false);
        volatile byte[] data = null;
    }

    /**
     * Конструктор принимает только единственный мост-коллбек.
     */
    public TwaDataBridge(TwaMessageBridgeCallback messageCallback) {
        this.messageCallback = messageCallback;
    }

    /**
     * Синхронный метод получения данных по ключу.
     */
    public byte[] getData(String key) {
        // Проверяем готовность канала через инкапсулированный метод коллбека
        if (messageCallback == null || !messageCallback.isChannelReady()) {
            return null;
        }

        CacheEntry entry = cache.computeIfAbsent(key, k -> new CacheEntry());
        boolean isFirstRequest = entry.isRequestSent.compareAndSet(false, true);

        try {
            if (isFirstRequest) {
                JSONObject message = new JSONObject();
                message.put("file", key);

                // Отправляем сообщение через messageCallback. Метод сам проверит сессию.
                boolean sent = messageCallback.postMessage(message.toString());
                if (!sent) {
                    return null; // Если отправка не удалась на системном уровне
                }
            }

            // Блокируем поток на время ожидания ответа
            boolean success = entry.latch.await(15, TimeUnit.SECONDS);
            if (success && entry.data != null) {
                return entry.data;
            }

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (isFirstRequest && entry.data == null) {
                cache.remove(key);
            }
        }
        return null;
    }

    public void processIncomingMessage(String messageString) {
        try {
            JSONObject response = new JSONObject(messageString);
            if (!response.has("file")) return;
            String key = response.getString("file");

            CacheEntry entry = cache.get(key);
            if (entry != null && response.has("data")) {
                if (entry.data == null) {
                    String base64Data = response.getString("data");
                    entry.data = Base64.decode(base64Data, Base64.DEFAULT);
                }
                entry.latch.countDown();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void clearCache() {
        cache.clear();
    }
}

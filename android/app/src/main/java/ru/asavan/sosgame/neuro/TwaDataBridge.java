package ru.asavan.sosgame.neuro;

import android.util.Base64;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
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

    public TwaDataBridge(TwaMessageBridgeCallback messageCallback) {
        this.messageCallback = messageCallback;
    }

    /**
     * Синхронный метод получения данных по ключу.
     * Не вызывайте в UI-потоке.
     */
    public byte[] getData(String key) {
        CacheEntry entry = cache.computeIfAbsent(key, k -> new CacheEntry());
        boolean isFirstRequest = entry.isRequestSent.compareAndSet(false, true);

        try {
            if (isFirstRequest) {
                JSONObject message = new JSONObject();
                message.put("file", key);

                boolean sent = messageCallback.postMessage(message.toString());
                if (!sent) {
                    // АТОМАРНЫЙ СБРОС И РАЗБЛОКИРОВКА:
                    // Возвращаем флаг в false, чтобы следующий вызов мог повторить попытку
                    entry.isRequestSent.set(false);
                    // Будим параллельные потоки, если они успели «подсесть» на этот latch
                    entry.latch.countDown();
                    return null;
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
            // Если отправка не удалась или произошел таймаут/ошибка у ПЕРВОГО потока,
            // удаляем запись из мапы кэша для возможности повторного запроса.
            if (isFirstRequest && entry.data == null) {
                cache.remove(key);
            }
        }
        return null;
    }

    public void processIncomingMessage(String messageString) {
        try {
            JSONObject response = new JSONObject(messageString);
            if (!response.has("file") || !response.has("data")) return;

            String key = response.getString("file");
            CacheEntry entry = cache.get(key);

            if (entry != null && entry.data == null) {
                String rawData = response.getString("data");
                // Если "encoding" не передан, по умолчанию считаем его "base64" для обратной совместимости
                String encoding = response.optString("encoding", "base64");

                // Декодируем данные в зависимости от указанного типа кодирования
                entry.data = decodePayload(rawData, encoding);

                // Разблокируем все ожидающие потоки (даже если декодирование вернуло null при ошибке форматирования)
                entry.latch.countDown();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private byte[] decodePayload(String rawData, String encoding) {
        try {
            switch (encoding) {
                case "plain_text":
                    // Превращаем обычную строку в байты напрямую (UTF-8)
                    return rawData.getBytes(StandardCharsets.UTF_8);

                case "base64":
                default:
                    // Декодируем из Base64, как и раньше
                    return Base64.decode(rawData, Base64.DEFAULT);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public void clearCache() {
        cache.clear();
    }
}

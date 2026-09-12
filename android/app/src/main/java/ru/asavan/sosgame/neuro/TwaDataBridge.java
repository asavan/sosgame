package ru.asavan.sosgame.neuro;

import android.util.Base64;
import android.util.Log;
import org.json.JSONObject;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import ru.asavan.sosgame.IDataGetter;

public class TwaDataBridge implements IDataGetter {

    private static final String MAIN_LOG_TAG = "TwaDataBridge";

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
                    entry.isRequestSent.set(false);
                    entry.latch.countDown();
                    return null;
                }
            }

            boolean success = entry.latch.await(15, TimeUnit.SECONDS);
            if (success && entry.data != null) {
                return entry.data;
            }

        } catch (Exception e) {
            Log.e(MAIN_LOG_TAG, "Error while waiting for data for key: " + key, e);
        } finally {
            if (isFirstRequest && entry.data == null) {
                cache.remove(key);
            }
        }
        return null;
    }

    /**
     * Публичный метод для обработки входящих JSON-сообщений от веб-страницы.
     */
    public void processIncomingMessage(String messageString) {
        try {
            JSONObject response = new JSONObject(messageString);
            if (!response.has("file") || !response.has("data")) return;

            String key = response.getString("file");
            CacheEntry entry = cache.get(key);

            if (entry != null && entry.data == null) {
                String rawData = response.getString("data");
                String encoding = response.optString("encoding", "base64");

                entry.data = decodePayload(rawData, encoding);
                entry.latch.countDown();
            }
        } catch (Exception e) {
            Log.e(MAIN_LOG_TAG, "Error while processing incoming message string", e);
        }
    }

    /**
     * Вспомогательный метод для декодирования входящей строки в массив байт.
     */
    private byte[] decodePayload(String rawData, String encoding) {
        try {
            switch (encoding) {
                case "plain_text":
                    return rawData.getBytes(StandardCharsets.UTF_8);

                case "base64":
                default:
                    return Base64.decode(rawData, Base64.DEFAULT);
            }
        } catch (Exception e) {
            Log.e(MAIN_LOG_TAG, "Failed to decode payload with encoding: " + encoding, e);
            return null;
        }
    }

    public void clearCache() {
        cache.clear();
    }
}

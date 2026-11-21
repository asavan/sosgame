package ru.asavan.sosgame.neuro;

import static androidx.browser.customtabs.CustomTabsService.RESULT_SUCCESS;

import android.util.Log;

import org.json.JSONObject;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import ru.asavan.sosgame.IDataGetter;
import ru.asavan.sosgame.IDataSetter;
import ru.asavan.sosgame.IMessageSender;

public class TwaDataBridge implements IDataGetter, IDataSetter {

    private static final String MAIN_LOG_TAG = "TwaDataBridge";

    private final IMessageSender messageSender;
    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

    private static class CacheEntry {
        final CountDownLatch latch = new CountDownLatch(1);
        final AtomicBoolean isRequestSent = new AtomicBoolean(false);
        volatile byte[] data = null;
    }

    public TwaDataBridge(IMessageSender messageCallback) {
        this.messageSender = messageCallback;
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
                message.put("name", key);
                message.put("type", "request");

                var sent = messageSender.postMessage(message.toString());
                if (sent != RESULT_SUCCESS) {
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

    @Override
    public void putData(String key, byte[] data) {
        CacheEntry entry = cache.get(key);
        if (entry == null) {
            Log.e(MAIN_LOG_TAG, "No such key in cache " + key);
            return;
        }
        entry.data = data;
        entry.latch.countDown();
    }
}

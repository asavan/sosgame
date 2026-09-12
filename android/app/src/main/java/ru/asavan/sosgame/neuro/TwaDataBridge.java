package ru.asavan.sosgame.neuro;

import android.util.Base64;
import androidx.browser.customtabs.CustomTabsSession;
import org.json.JSONObject;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

public class TwaDataBridge implements TwaMessageBridgeCallback.PostMessageListener {

    private final CustomTabsSession customTabsSession;
    private final TwaMessageBridgeCallback messageBridgeCallback;
    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

    private static class CacheEntry {
        final CountDownLatch latch = new CountDownLatch(1);
        final AtomicBoolean isRequestSent = new AtomicBoolean(false);
        volatile byte[] data = null;
    }

    public TwaDataBridge(CustomTabsSession session, TwaMessageBridgeCallback callback) {
        this.customTabsSession = session;
        this.messageBridgeCallback = callback;
        this.messageBridgeCallback.registerListener(this);
    }

    public byte[] getData(String key) {
        if (customTabsSession == null || !messageBridgeCallback.isChannelReady()) {
            return null;
        }

        CacheEntry entry = cache.computeIfAbsent(key, k -> new CacheEntry());
        boolean isFirstRequest = entry.isRequestSent.compareAndSet(false, true);

        try {
            if (isFirstRequest) {
                JSONObject message = new JSONObject();
                message.put("file", key);
                customTabsSession.postMessage(message.toString(), null);
            }

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

    @Override
    public void onMessageReceived(String messageString) {
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

    public void release() {
        messageBridgeCallback.unregisterListener(this);
        cache.clear();
    }
}

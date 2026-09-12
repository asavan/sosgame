package ru.asavan.sosgame;

import android.content.ComponentName;
import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import androidx.browser.customtabs.CustomTabsClient;
import androidx.browser.customtabs.CustomTabsCallback;
import androidx.browser.customtabs.CustomTabsSession;
import androidx.browser.customtabs.CustomTabsServiceConnection;
import org.json.JSONObject;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

public class TwaDataBridge {

    private final Context context;
    private final Uri webAppUri;

    // Единое хранилище для кэша и активных запросов
    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

    private CustomTabsSession customTabsSession;
    private CustomTabsServiceConnection serviceConnection;
    private boolean isPostMessageChannelReady = false;

    // Внутренняя структура элемента кэша
    private static class CacheEntry {
        final CountDownLatch latch = new CountDownLatch(1);
        final AtomicBoolean isRequestSent = new AtomicBoolean(false);
        volatile byte[] data = null;
    }

    public TwaDataBridge(Context context, String webAppUrl) {
        this.context = context;
        this.webAppUri = Uri.parse(webAppUrl);
        initializeTwaConnection();
    }

    /**
     * Синхронный метод получения данных по ключу.
     * Не вызывайте в UI-потоке.
     */
    public byte[] getData(String key) {
        if (customTabsSession == null || !isPostMessageChannelReady) {
            return null;
        }

        // Получаем существующую запись или атомарно создаем новую
        CacheEntry entry = cache.computeIfAbsent(key, k -> new CacheEntry());

        // Атомарно проверяем и устанавливаем флаг отправки.
        // true вернется ТОЛЬКО первому потоку, зашедшему для этого ключа.
        boolean isFirstRequest = entry.isRequestSent.compareAndSet(false, true);

        try {
            if (isFirstRequest) {
                JSONObject message = new JSONObject();
                message.put("file", key);
                customTabsSession.postMessage(message.toString(), null);
            }

            // Все потоки (и первый, и «подсевшие») ждут здесь.
            // Если данные уже были в кэше, latch имеет count = 0 и await() вернет true мгновенно.
            boolean success = entry.latch.await(15, TimeUnit.SECONDS);

            if (success && entry.data != null) {
                return entry.data;
            }

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            // Если произошел таймаут или ошибка, и при этом данные так и не пришли,
            // удаляем запись из кэша, чтобы следующий вызов мог повторить попытку.
            if (isFirstRequest && entry.data == null) {
                cache.remove(key);
            }
        }

        return null;
    }

    private void initializeTwaConnection() {
        String packageName = CustomTabsClient.getPackageName(context, null);
        if (packageName == null) return;

        serviceConnection = new CustomTabsServiceConnection() {
            @Override
            public void onCustomTabsServiceConnected(ComponentName name, CustomTabsClient client) {
                client.warmup(0L);
                customTabsSession = client.newSession(new CustomTabsCallback() {
                    @Override
                    public void onPostMessage(String message, Bundle extras) {
                        handleIncomingMessage(message);
                    }

                    @Override
                    public void onMessageChannelReady(Bundle extras) {
                        isPostMessageChannelReady = true;
                    }
                });
                if (customTabsSession != null) {
                    customTabsSession.requestPostMessageChannel(webAppUri);
                }
            }

            @Override
            public void onServiceDisconnected(ComponentName name) {
                customTabsSession = null;
                isPostMessageChannelReady = false;
            }
        };
        CustomTabsClient.bindCustomTabsService(context, packageName, serviceConnection);
    }

    private void handleIncomingMessage(String messageString) {
        try {
            JSONObject response = new JSONObject(messageString);
            if (!response.has("file")) return;
            String key = response.getString("file");

            CacheEntry entry = cache.get(key);
            if (entry != null && response.has("data")) {
                // Избегаем повторного декодирования, если вдруг веб-страница прислала дубликат
                if (entry.data == null) {
                    String base64Data = response.getString("data");
                    entry.data = Base64.decode(base64Data, Base64.DEFAULT);
                }
                // Будим все ожидающие потоки
                entry.latch.countDown();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void cleanup() {
        if (serviceConnection != null) {
            context.unbindService(serviceConnection);
        }
        cache.clear();
    }
}

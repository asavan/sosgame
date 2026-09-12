package ru.asavan.sosgame.neuro;

import android.net.Uri;
import android.os.Bundle;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.browser.customtabs.CustomTabsCallback;
import androidx.browser.customtabs.CustomTabsSession;
import java.util.concurrent.CopyOnWriteArrayList;

public class TwaMessageBridgeCallback extends CustomTabsCallback {

    public interface PostMessageListener {
        void onMessageReceived(String message);
    }

    private final CopyOnWriteArrayList<PostMessageListener> listeners = new CopyOnWriteArrayList<>();

    private CustomTabsSession currentSession;
    private Uri targetOriginUri;
    private volatile boolean isChannelReady = false;

    public void registerListener(PostMessageListener listener) {
        listeners.add(listener);
    }

    public void unregisterListener(PostMessageListener listener) {
        listeners.remove(listener);
    }

    public boolean isChannelReady() {
        return isChannelReady;
    }

    /**
     * Динамическая настройка сессии и целевого URL.
     * Вызывается извне при смене конфигурации или инициализации.
     */
    public void configureChannel(@Nullable CustomTabsSession session, @Nullable String targetUrl) {
        this.currentSession = session;
        this.targetOriginUri = targetUrl != null ? Uri.parse(targetUrl) : null;
        this.isChannelReady = false;
    }

    public void setSession(CustomTabsSession session) {
        this.currentSession = session;
    }

    /**
     * Настраивает целевой URL перед переходом на новый сайт.
     */
    public void setTargetUrl(String targetUrl) {
        this.targetOriginUri = targetUrl != null ? Uri.parse(targetUrl) : null;
        this.isChannelReady = false; // Сбрасываем флаг для нового сайта
    }

    @Override
    public void onNavigationEvent(int navigationEvent, @Nullable Bundle extras) {
        // Проверяем, завершилась ли загрузка страницы
        if (navigationEvent == CustomTabsCallback.NAVIGATION_FINISHED) {
            if (currentSession != null && targetOriginUri != null) {
                // Страница загружена — самое время безопасно открыть PostMessage канал
                currentSession.requestPostMessageChannel(targetOriginUri);
            }
        }
    }

    @Override
    public void onMessageChannelReady(@Nullable Bundle extras) {
        isChannelReady = true;
    }

    @Override
    public void onPostMessage(@NonNull String message, @Nullable Bundle extras) {
        for (PostMessageListener listener : listeners) {
            listener.onMessageReceived(message);
        }
    }
}

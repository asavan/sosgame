package ru.asavan.sosgame.neuro;

import static androidx.browser.customtabs.CustomTabsService.RESULT_SUCCESS;

import android.net.Uri;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.browser.customtabs.CustomTabsCallback;
import androidx.browser.customtabs.CustomTabsSession;

public class TwaMessageBridgeCallback extends CustomTabsCallback {

    public interface PostMessageListener {
        void onMessageReceived(String message);
    }

    private CustomTabsSession currentSession;
    private Uri targetOriginUri;
    private volatile boolean isChannelReady = false;

    // Вместо списка используем одну волатильную ссылку на текущего слушателя
    private volatile PostMessageListener activeListener;

    public boolean isChannelReady() {
        return isChannelReady;
    }

    public void setSession(CustomTabsSession session) {
        this.currentSession = session;
    }

    /**
     * Отправляет сообщение на веб-страницу, если сессия и порты готовы.
     */
    public boolean postMessage(@NonNull String message) {
        if (currentSession != null && isChannelReady) {
            return currentSession.postMessage(message, null) == RESULT_SUCCESS;
        }
        return false;
    }

    /**
     * Атомарно меняет целевой URL и устанавливает нового слушателя.
     */
    public synchronized void swapTargetAndListener(@NonNull String newUrl, @NonNull PostMessageListener newListener) {
        this.targetOriginUri = Uri.parse(newUrl);
        this.isChannelReady = false;
        this.activeListener = newListener; // Просто перезаписываем ссылку
    }

    /**
     * Полная очистка ресурсов при уничтожении Activity.
     */
    public synchronized void clear() {
        this.activeListener = null;
        this.targetOriginUri = null;
        this.isChannelReady = false;
    }

    @Override
    public void onNavigationEvent(int navigationEvent, @Nullable Bundle extras) {
        if (navigationEvent == CustomTabsCallback.NAVIGATION_FINISHED) {
            if (currentSession != null && targetOriginUri != null) {
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
        // Локальная копия для потокобезопасного вызова без synchronized-блока
        PostMessageListener listener = this.activeListener;
        if (listener != null) {
            listener.onMessageReceived(message);
        }
    }
}

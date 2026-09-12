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
    private PostMessageListener activeListener;

    public boolean isChannelReady() {
        return isChannelReady;
    }

    public void setSession(CustomTabsSession session) {
        this.currentSession = session;
    }

    /**
     * Отправляет сообщение на веб-страницу, если сессия и порты готовы.
     * @return true, если сообщение успешно отправлено
     */
    public boolean postMessage(@NonNull String message) {
        if (currentSession != null && isChannelReady) {
            // Отправляем сообщение через инкапсулированную сессию
            return currentSession.postMessage(message, null) == 0;
        }
        return false;
    }

    /**
     * Атомарный своп целевого URL и слушателя данных.
     */
    public synchronized void swapTargetAndListener(@NonNull String newUrl, @NonNull PostMessageListener newListener) {
        if (this.activeListener != null) {
            listeners.remove(this.activeListener);
        }

        this.targetOriginUri = Uri.parse(newUrl);
        this.isChannelReady = false;

        this.activeListener = newListener;
        listeners.add(newListener);
    }

    public synchronized void clear() {
        if (this.activeListener != null) {
            listeners.remove(this.activeListener);
            this.activeListener = null;
        }
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
        for (PostMessageListener listener : listeners) {
            listener.onMessageReceived(message);
        }
    }
}

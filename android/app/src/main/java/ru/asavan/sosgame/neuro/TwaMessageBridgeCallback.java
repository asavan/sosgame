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

    public void setSession(CustomTabsSession session) {
        this.currentSession = session;
    }

    public void setTargetUrl(String targetUrl) {
        this.targetOriginUri = targetUrl != null ? Uri.parse(targetUrl) : null;
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

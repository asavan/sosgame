package ru.asavan.sosgame.neuro;

import static androidx.browser.customtabs.CustomTabsService.RESULT_FAILURE_REMOTE_ERROR;

import static ru.asavan.sosgame.AndroidWebServerActivity.MAIN_LOG_TAG;

import android.net.Uri;
import android.os.Bundle;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.browser.customtabs.CustomTabsCallback;
import androidx.browser.customtabs.CustomTabsSession;

import ru.asavan.sosgame.IMessageSender;
import ru.asavan.sosgame.IProviderSetter;

public class TwaMessageBridgeCallback extends CustomTabsCallback {
    private final MessageDispatcher messageDispatcher;
    private final IProviderSetter providerSetter;
    private CustomTabsSession currentSession;
    private Uri targetOriginUri;

    public TwaMessageBridgeCallback(MessageDispatcher messageDispatcher, IProviderSetter providerSetter) {
        this.messageDispatcher = messageDispatcher;
        this.providerSetter = providerSetter;
    }

    public void setSession(CustomTabsSession session) {
        this.currentSession = session;
    }

    /**
     * Полная очистка ресурсов при уничтожении Activity.
     */
    public synchronized void clear() {
        this.targetOriginUri = null;
    }

    public CustomTabsSession getSession() {
        return currentSession;
    }

    public synchronized void setLaunchUri(Uri launchUri) {
        this.targetOriginUri = launchUri;
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

        IMessageSender messageSender = message -> {
            if (currentSession != null) {
                return currentSession.postMessage(message, null);
            }
            return RESULT_FAILURE_REMOTE_ERROR;
        };
        var result = messageSender.postMessage("First message");
        Log.d(MAIN_LOG_TAG, "postMessage returned: " + result);
        messageDispatcher.registerHandler(new BrowserServerHandler(messageDispatcher, providerSetter, messageSender));
    }

    @Override
    public void onWarmupCompleted(Bundle extras) {
        Log.d(MAIN_LOG_TAG, "onWarmupCompleted");
    }

    @Override
    public void onPostMessage(@NonNull String message, @Nullable Bundle extras) {
        // Локальная копия для потокобезопасного вызова без synchronized-блока
        super.onPostMessage(message, extras);
        // Передаем строку в диспетчер
        messageDispatcher.dispatch(message);
    }
}

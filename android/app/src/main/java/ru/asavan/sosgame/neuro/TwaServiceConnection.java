package ru.asavan.sosgame.neuro;

import android.content.ComponentName;
import android.content.Context;
import androidx.browser.customtabs.CustomTabsClient;
import androidx.browser.customtabs.CustomTabsSession;
import androidx.browser.customtabs.CustomTabsServiceConnection;

/**
 * Системный коннекшен. Только биндит сервис и сообщает о создании сессии.
 */
public class TwaServiceConnection extends CustomTabsServiceConnection {

    public interface OnSessionReadyListener {
        void onSessionCreated(CustomTabsSession session);
    }

    private final TwaMessageBridgeCallback callback;
    private final OnSessionReadyListener sessionReadyListener;
    private CustomTabsSession currentSession;

    public TwaServiceConnection(TwaMessageBridgeCallback callback, OnSessionReadyListener listener) {
        this.callback = callback;
        this.sessionReadyListener = listener;
    }

    @Override
    public void onCustomTabsServiceConnected(ComponentName name, CustomTabsClient client) {
        client.warmup(0L);
        currentSession = client.newSession(callback);

        callback.setSession(currentSession);

        if (currentSession != null && sessionReadyListener != null) {
            sessionReadyListener.onSessionCreated(currentSession);
        }
    }

    @Override
    public void onServiceDisconnected(ComponentName name) {
        currentSession = null;
    }

    public CustomTabsSession getSession() {
        return currentSession;
    }

    public void bind(Context context) {
        String packageName = CustomTabsClient.getPackageName(context, null);
        if (packageName != null) {
            CustomTabsClient.bindCustomTabsService(context, packageName, this);
        }
    }

    public void unbind(Context context) {
        context.unbindService(this);
    }
}

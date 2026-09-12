package ru.asavan.sosgame.neuro;

import android.content.ComponentName;
import android.content.Context;
import androidx.browser.customtabs.CustomTabsClient;
import androidx.browser.customtabs.CustomTabsSession;
import androidx.browser.customtabs.CustomTabsServiceConnection;

public class TwaServiceConnection extends CustomTabsServiceConnection {

    private final TwaMessageBridgeCallback callback;
    private CustomTabsSession currentSession;

    public TwaServiceConnection(TwaMessageBridgeCallback callback) {
        this.callback = callback;
    }

    @Override
    public void onCustomTabsServiceConnected(ComponentName name, CustomTabsClient client) {
        client.warmup(0L);
        currentSession = client.newSession(callback);

        if (currentSession != null) {
            // Передаем созданную сессию в коллбек
            callback.setSession(currentSession);
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

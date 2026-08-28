package ru.asavan.sosgame;

import static ru.asavan.sosgame.AndroidWebServerActivity.MAIN_LOG_TAG;

import android.content.ComponentName;
import android.content.Context;
import android.net.Uri;
import android.util.Log;

import androidx.browser.customtabs.CustomTabsClient;
import androidx.browser.customtabs.CustomTabsServiceConnection;
import androidx.browser.customtabs.CustomTabsSession;
import androidx.browser.trusted.TrustedWebActivityIntent;
import androidx.browser.trusted.TrustedWebActivityIntentBuilder;

import org.jspecify.annotations.NonNull;

public class ServiceConnectionWithUrl extends CustomTabsServiceConnection {
    private Uri mLaunchUri;
    private final CustomTabsCallbackWithSession customTabsCallbackWithSession;

    private final Context context;

    private int connectionCounter = 0;
    public ServiceConnectionWithUrl(Uri launchUri, CustomTabsCallbackWithSession customTabsCallbackWithSession, Context context) {
        mLaunchUri = launchUri;
        this.customTabsCallbackWithSession = customTabsCallbackWithSession;
        this.context = context;
    }
    @Override
    public void onCustomTabsServiceConnected(@NonNull ComponentName name, @NonNull CustomTabsClient client) {
        ++connectionCounter;
        Log.i(MAIN_LOG_TAG, "onCustomTabsServiceConnected " + connectionCounter);
        if (connectionCounter > 1) {
            Log.e(MAIN_LOG_TAG, "Too Many connections " + connectionCounter);
        }
        client.warmup(0L);
        // Safely create the session with your message callback attached!
        var session = client.newSession(customTabsCallbackWithSession);
        tryLaunch(mLaunchUri, session);
    }

    @Override
    public void onServiceDisconnected(ComponentName componentName) {
        Log.i(MAIN_LOG_TAG, "onServiceDisconnected " + connectionCounter);
        customTabsCallbackWithSession.setSession(null);
    }

    public void tryLaunch(Uri launchUri) {
        mLaunchUri = launchUri;
        tryLaunch(launchUri, customTabsCallbackWithSession.getSession());
    }

    private void tryLaunch(Uri launchUri, CustomTabsSession session) {
        if (session != null) {
            Log.i(MAIN_LOG_TAG, "Launch " + launchUri);
            TrustedWebActivityIntentBuilder builder = new TrustedWebActivityIntentBuilder(launchUri);
            customTabsCallbackWithSession.setSession(session);
            customTabsCallbackWithSession.setLaunchUri(launchUri);
            // Launch the TWA Activity using standard intent building blocks
            TrustedWebActivityIntent twaIntent = builder.build(session);
            // Corrected: Launch via the TWA intent method directly
            twaIntent.launchTrustedWebActivity(context);
        } else {
            Log.e(MAIN_LOG_TAG, "No session");
        }
    }
}

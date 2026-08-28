package ru.asavan.sosgame;

import static ru.asavan.sosgame.AndroidWebServerActivity.MAIN_LOG_TAG;

import android.net.Uri;
import android.os.Bundle;
import android.util.Log;

import androidx.browser.customtabs.CustomTabsCallback;
import androidx.browser.customtabs.CustomTabsSession;

import org.jspecify.annotations.Nullable;

public class CustomTabsCallbackWithSession extends CustomTabsCallback {
    private boolean mValidated = false;
    private CustomTabsSession mSession;

    private Uri mLaunchUri;
    public void setSession(CustomTabsSession session) {
        Log.d(MAIN_LOG_TAG, "setSession");
        this.mSession = session;
    }

    public CustomTabsSession getSession() {
        return mSession;
    }

    public void setLaunchUri(Uri launchUri) {
        this.mLaunchUri = launchUri;
    }

    @Override
    public void onRelationshipValidationResult(int relation, Uri requestedOrigin,
                                               boolean result, @Nullable Bundle extras) {
        Log.d(MAIN_LOG_TAG, "onRelationshipValidationResult: " + relation + " " + result + " " + requestedOrigin);
        mValidated = result;
    }

    @Override
    public void onNavigationEvent(@NavigationEvent int navigationEvent, @Nullable Bundle extras) {
        Log.d(MAIN_LOG_TAG, "onNavigationEvent: " + navigationEvent);
        if (navigationEvent != NAVIGATION_FINISHED) {
            return;
        }
        if (!mValidated) {
            Log.w(MAIN_LOG_TAG, "validation not pass");
            // return;
        }
        boolean result = mSession.requestPostMessageChannel(mLaunchUri);
        Log.d(MAIN_LOG_TAG, "Requested Post Message Channel: " + result);
    }

    @Override
    public void onWarmupCompleted(Bundle extras) {
        Log.d(MAIN_LOG_TAG, "onWarmupCompleted");
    }

    @Override
    public void onMessageChannelReady(Bundle extras) {
        Log.i(MAIN_LOG_TAG, "onMessageChannelReady");
        int result = mSession.postMessage("First message", null);
        Log.d(MAIN_LOG_TAG, "postMessage returned: " + result);
    }
}


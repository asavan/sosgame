package ru.asavan.sosgame;

import static ru.asavan.sosgame.AndroidWebServerActivity.MAIN_LOG_TAG;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.widget.Button;

import androidx.annotation.NonNull;
import androidx.browser.customtabs.CustomTabsClient;

import com.luigivampa92.ndefemulation.NdefEmulation;
import com.luigivampa92.ndefemulation.ndef.UriNdefData;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.Collections;
import java.util.Map;

public class BtnUtils implements ISetTree {
    private final int staticContentPort;
    private final Activity activity;
    private ISetTreeServer server = null;
    private ServiceConnectionWithUrl mConnection;


    private NdefEmulation ndefEmulation;

    public BtnUtils(Activity activity, int staticContentPort) {
        this.staticContentPort = staticContentPort;
        this.activity = activity;
        // this.mdnsUtils = new MdnsUtils(activity, MAIN_LOG_TAG);
    }

    public void launchWebView(String host, Map<String, String> parameters) {
        Intent intent = new Intent(activity.getApplicationContext(), WebViewActivity.class);
        String launchUrl = UrlUtils.getLaunchUrl(host, parameters);
        Log.i("BTN_UTILS", launchUrl);
        intent.putExtra("url", launchUrl);
        activity.startActivity(intent);
    }

    private void launchWebViewAndServer(String host, Map<String, String> parameters) {
        startServerAndSocket();
        launchWebView(host, parameters);
    }

    public int getPort() {
        return staticContentPort;
    }

    public void addButtonWebView(final String host, Map<String, String> parameters, int btnId) {
        Button btn = activity.findViewById(btnId);
        btn.setOnClickListener(v -> {
            launchWebView(host, parameters);
        });
    }

    public void addButtonBrowser(final String host, Map<String, String> parameters, int btnId) {
        addButtonBrowser(host, parameters, btnId, null);
    }

    public void addButtonBrowser(final String host, Map<String, String> parameters, int btnId, String text) {
        Button btn = activity.findViewById(btnId);
        if (text != null && !text.isEmpty()) {
            String newText = btn.getText() + " " + text;
            btn.setText(newText);
        }
        btn.setOnClickListener(v -> launchBrowser(host, parameters));
    }

    public void addButtonTwa(String host, Map<String, String> parameters, int id) {
        addButtonTwa(host, parameters, id, null);
    }

    public void addButtonTwa(String host, Map<String, String> parameters, int id, String text) {
        Button btn = activity.findViewById(id);
        if (text != null) {
            String newText = btn.getText() + " " + text;
            btn.setText(newText);
        }
        btn.setOnClickListener(v -> launchTwa(host, parameters));
    }

    private void launchBrowser(String host, Map<String, String> parameters) {
        startServerAndSocket();
        launchNFC(host, parameters);
        Uri launchUri = Uri.parse(UrlUtils.getLaunchUrl(host, parameters));
        activity.startActivity(new Intent(Intent.ACTION_VIEW, launchUri));
    }

    public void launchTwa(String host, Map<String, String> parameters) {
        Log.i(MAIN_LOG_TAG, "launchTwa " + host);
        startServerAndSocket();
        launchNFC(host, parameters);
        Uri launchUri = Uri.parse(UrlUtils.getLaunchUrl(host, parameters));
        if (mConnection != null) {
            mConnection.tryLaunch(launchUri);
            return;
        }
        mConnection = getTabsServiceConnection(launchUri);

        // Bind Custom Tabs Service targeting the user's preferred modern browser (e.g. Chrome)
        String packageName = CustomTabsClient.getPackageName(activity, Collections.singletonList("com.android.chrome"));
        // String packageName = CustomTabsClient.getPackageName(activity, null);
        Log.i(MAIN_LOG_TAG, "PackageName " + packageName);
        if (packageName != null) {
            CustomTabsClient.bindCustomTabsServicePreservePriority(activity, packageName, mConnection);
        }
    }

    @NonNull
    private ServiceConnectionWithUrl getTabsServiceConnection(Uri launchUri) {
        CustomTabsCallbackWithSession callback = getCustomTabsCallback();
        ServiceConnectionWithUrl mConnection = new ServiceConnectionWithUrl(launchUri, callback, activity);
        return mConnection;
    }

    @NonNull
    private CustomTabsCallbackWithSession getCustomTabsCallback() {
        CustomTabsCallbackWithSession callback = new CustomTabsCallbackWithSession() {
            @Override
            public void onPostMessage(String message, Bundle extras) {
                super.onPostMessage(message, extras);
                Log.d(MAIN_LOG_TAG, "Message from Web: " + message);

                try {
                    // 1. Initialize JSONObject with the string
                    JSONObject jsonObject = new JSONObject(message);

                    // 2. Extract values using specific types
                    boolean hasSh = jsonObject.has("sh");
                    if (hasSh) {
                        String sh = jsonObject.getString("sh");
                        Log.i(MAIN_LOG_TAG, "Message from Web sh: " + sh);
                        launchNFC(sh, null);
                    }

                } catch (JSONException e) {
                    Log.i(MAIN_LOG_TAG, "Not json");
                }
            }
        };
        return callback;
    }

    private void launchNFC(String host, Map<String, String> parameters) {
        try {
            var url = host;
            if (parameters != null) {
                var sh = parameters.get("sh");
                if (sh != null) {
                    url = sh;
                }
            }
            if (url == null) {
                Log.e(MAIN_LOG_TAG, "launchNFC fail null url");
                return;
            }
            ndefEmulation.setCurrentEmulatedNdefData(new UriNdefData(url));
        } catch (Exception ex) {
            Log.e(MAIN_LOG_TAG, "launchNFC fail", ex);
        }
    }

    public void startServerAndSocket() {
        Log.i(MAIN_LOG_TAG, "startServerAndSocket");
        if (server != null) {
            return;
        }
        try {
            Context applicationContext = activity.getApplicationContext();
            startServerInner(applicationContext);
        } catch (Exception e) {
            Log.e("BTN_UTILS", "main", e);
        }
    }

    protected void startServerInner(Context applicationContext) throws IOException {
        Log.i(MAIN_LOG_TAG, "BtnUtilsStarted");
        ndefEmulation = new NdefEmulation(applicationContext);
        server = new WebServerWithSocket(applicationContext, staticContentPort);
        server.start();
    }

    protected void onDestroy() {
        ndefEmulation.setCurrentEmulatedNdefData(null);
        if (server != null) {
            server.stop();
        }
        server = null;
    }

    @Override
    public void setBaseTreeUri(Uri baseTreeUri) {
        if (server != null) {
            server.setBaseTreeUri(baseTreeUri);
        }
    }
}

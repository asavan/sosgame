package ru.asavan.sosgame;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;
import android.widget.Button;

import androidx.browser.trusted.TrustedWebActivityIntentBuilder;

import com.google.androidbrowserhelper.trusted.QualityEnforcer;
import com.google.androidbrowserhelper.trusted.TwaLauncher;
import com.luigivampa92.ndefemulation.NdefEmulation;
import com.luigivampa92.ndefemulation.ndef.UriNdefData;

import java.util.Map;

import fi.iki.elonen.NanoHTTPD;

public class BtnUtils {
    private final int staticContentPort;
    private final Activity activity;
    private WebServer server = null;


    private NdefEmulation ndefEmulation;

    public BtnUtils(Activity activity, int staticContentPort) {
        this.staticContentPort = staticContentPort;
        this.activity = activity;
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
        startServerAndSocket();
        launchNFC(host, parameters);
        Uri launchUri = Uri.parse(UrlUtils.getLaunchUrl(host, parameters));
        TwaLauncher launcher = new TwaLauncher(activity);
        launcher.launch(new TrustedWebActivityIntentBuilder(launchUri), new QualityEnforcer(), null, null);
    }

    private void launchNFC(String host, Map<String, String> parameters) {
        try {
            var sh = parameters.get("sh");
            if (sh != null) {
                ndefEmulation.setCurrentEmulatedNdefData(new UriNdefData(sh));
            } else {
                ndefEmulation.setCurrentEmulatedNdefData(new UriNdefData(host));
            }
        } catch (Exception ex) {
            // ignore
        }
    }

    private void startServerAndSocket() {
        if (server != null) {
            return;
        }
        try {
            Context applicationContext = activity.getApplicationContext();
            ndefEmulation = new NdefEmulation(applicationContext);
            server = new WebServer(applicationContext, staticContentPort);
            server.start(NanoHTTPD.SOCKET_READ_TIMEOUT, false);
        } catch (Exception e) {
            Log.e("BTN_UTILS", "main", e);
        }
    }

    protected void onDestroy() {
        ndefEmulation.setCurrentEmulatedNdefData(null);
        if (server != null) {
            server.stop();
        }
        server = null;
    }
}

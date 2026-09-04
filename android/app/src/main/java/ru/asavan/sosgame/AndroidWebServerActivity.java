package ru.asavan.sosgame;

import android.net.Uri;
import android.os.Bundle;
import android.util.Log;


import androidx.activity.ComponentActivity;

import java.util.LinkedHashMap;
import java.util.Map;


public class AndroidWebServerActivity extends ComponentActivity implements ISetTree {
    private static final int STATIC_CONTENT_PORT = 8080;
    private static final int WEB_SOCKET_PORT = 8080;
    private static final String WEB_GAME_URL = "https://asavan.github.io/sosgame/";
    // public static final String WEB_VIEW_URL = "file:///android_asset/www/index.html";
    public static final String WEB_VIEW_URL = "https://appassets.androidplatform.net/assets/www/index.html";

    public static final String MAIN_LOG_TAG = "SOS_TAG";
    private static final boolean secure = false;

    private BtnUtils btnUtils;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.main);
        btnUtils = new BtnUtilsWithMdns(this, STATIC_CONTENT_PORT);
        try {
            addButtons(IpUtils.getIPAddressSafe());
            btnUtils.startServerAndSocket();
            //  btnUtils.launchTwa(WEB_GAME_URL, null);
            // btnUtils.launchWebView(WEB_VIEW_URL, null);
        } catch (Exception e) {
            Log.e(MAIN_LOG_TAG, "main", e);
        }
    }

    private void addButtons(String formattedIpAddress) {
        HostUtils hostUtils = new HostUtils(STATIC_CONTENT_PORT, WEB_SOCKET_PORT, secure);
        final String host = hostUtils.getStaticHost(formattedIpAddress);
        {
            Map<String, String> aiParams = new LinkedHashMap<>();
            aiParams.put("mode", "ai");
            btnUtils.addButtonTwa(WEB_GAME_URL, aiParams, R.id.twa_ai);
            btnUtils.addButtonTwa(hostUtils.getStaticHost(IpUtils.LOCALHOST), aiParams, R.id.twa_ai_localhost);
            btnUtils.addButtonWebView(WEB_VIEW_URL, aiParams, R.id.ai);
        }
        {
            Map<String, String> b = new LinkedHashMap<>();
            b.put("sh", host);
            b.put("mode", "server");
            btnUtils.addButtonBrowser(host, b, R.id.launch_browser);
            btnUtils.addButtonTwa(hostUtils.getStaticHost(IpUtils.LOCALHOST), b, R.id.twa_real_ip, host);
        }
        {
            Map<String, String> b = new LinkedHashMap<>();
            b.put("wh", hostUtils.getSocketHost(IpUtils.LOCALHOST));
            b.put("sh", host);
            b.put("mode", "server");
            btnUtils.addButtonWebView(WEB_VIEW_URL, b, R.id.webview_localhost);
            btnUtils.addButtonTwa(WEB_GAME_URL, b, R.id.newest);
        }
        {
            Map<String, String> b = new LinkedHashMap<>();
            b.put("sh", host);
            b.put("mode", "swrtc");
            btnUtils.addButtonTwa(hostUtils.getStaticHost(IpUtils.LOCALHOST), b, R.id.twa_127);
        }
        {
            Map<String, String> b = new LinkedHashMap<>();
            b.put("sh", host);
            b.put("mode", "test");
            btnUtils.addButtonTwa(hostUtils.getStaticHost(IpUtils.LOCALHOST), b, R.id.network_info);
        }
    }

    @Override
    protected void onDestroy() {
        if (btnUtils != null) {
            btnUtils.onDestroy();
        }
        btnUtils = null;
        super.onDestroy();
    }

    @Override
    public void setBaseTreeUri(Uri baseTreeUri) {
        Log.i(MAIN_LOG_TAG, "setBaseTreeUri1");
        if (btnUtils != null) {
            if (baseTreeUri == null) {
                Log.i(MAIN_LOG_TAG, "setBaseTreeUri2");
            } else {
                Log.i(MAIN_LOG_TAG, "setBaseTreeUri3 " + baseTreeUri);
            }
            btnUtils.setBaseTreeUri(baseTreeUri);
        }
    }
}

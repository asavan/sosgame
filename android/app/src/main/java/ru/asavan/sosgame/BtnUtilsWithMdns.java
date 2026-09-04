package ru.asavan.sosgame;

import static ru.asavan.sosgame.AndroidWebServerActivity.MAIN_LOG_TAG;

import android.app.Activity;
import android.content.Context;
import android.util.Log;

import java.io.IOException;

public class BtnUtilsWithMdns extends BtnUtils {

    private final MvMdnsManager mvMdnsManager;

    public BtnUtilsWithMdns(Activity activity, int staticContentPort) {
        super(activity, staticContentPort);
        mvMdnsManager = new MvMdnsManager();
    }

    @Override
    protected void startServerInner(Context applicationContext) throws IOException {
        Log.i(MAIN_LOG_TAG, "BtnUtilsWithMdns");
        try {
            mvMdnsManager.registerService(applicationContext, "sosgame", getPort());
        } catch (Exception ex) {
            Log.e(MAIN_LOG_TAG, "BtnUtilsWithMdns error", ex);
        }
        super.startServerInner(applicationContext);
    }

    @Override
    protected void onDestroy() {
        mvMdnsManager.unregisterService();
        super.onDestroy();
    }
}

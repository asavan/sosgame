package ru.asavan.sosgame;

import static ru.asavan.sosgame.AndroidWebServerActivity.MAIN_LOG_TAG;

import android.app.Activity;
import android.content.Context;
import android.util.Log;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class BtnUtilsWithMdns extends BtnUtils {

    private final MvMdnsManager mvMdnsManager;

    private final List<String> mNames;
    private final ExecutorService networkExecutor;

    public BtnUtilsWithMdns(Activity activity, int staticContentPort, List<String> names) {
        super(activity, staticContentPort);
        mvMdnsManager = new MvMdnsManager();
        mNames = names;
        networkExecutor = Executors.newSingleThreadExecutor();
    }

    @Override
    protected void startServerInner(Context applicationContext) throws IOException {
        Log.i(MAIN_LOG_TAG, "BtnUtilsWithMdns");
        networkExecutor.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    mvMdnsManager.registerService(mNames);
                } catch (Exception ex) {
                    Log.e(MAIN_LOG_TAG, "BtnUtilsWithMdns error", ex);
                }
            }
        });
        super.startServerInner(applicationContext);
    }

    @Override
    protected void onDestroy() {
        networkExecutor.execute(new Runnable() {
            @Override
            public void run() {
                mvMdnsManager.unregisterService();
            }
        });
        networkExecutor.shutdown();
        try {
            boolean awaited = networkExecutor.awaitTermination(2, TimeUnit.SECONDS);
            Log.d(MAIN_LOG_TAG, "shutdown " + awaited);
        } catch (InterruptedException e) {
            Log.w(MAIN_LOG_TAG, "shutdown interrupted", e);
        }
        super.onDestroy();
    }
}

package ru.asavan.sosgame;

import static ru.asavan.sosgame.AndroidWebServerActivity.MAIN_LOG_TAG;

import android.net.wifi.WifiManager;
import android.util.Log;
import java.io.IOException;
import java.net.InetAddress;
import java.util.ArrayList;
import java.util.List;

import javax.jmdns.JmDNS;

public class MvMdnsManager {
    private static final String TAG = MAIN_LOG_TAG;

    private List<JmDNS> jmdns;

    public MvMdnsManager() {
        jmdns = new ArrayList<>();
    }

    public void registerService(List<String> names) {
        try {
            // Получаем IP-адрес через современный ConnectivityManager
            InetAddress bindingAddress = IpUtils.getMainAddress();

            if (bindingAddress == null) {
                Log.e(TAG, "Не удалось получить IP-адрес Wi-Fi. Устройство подключено к сети?");
                return;
            }

            Log.d(TAG, "Binding JmDNS to IP: " + bindingAddress.getHostAddress());
            for (var name : names) {
                jmdns.add(JmDNS.create(bindingAddress, name));
                Log.d(TAG, "Служба успешно зарегистрирована через JmDNS: " + name);
            }
        } catch (IOException e) {
            Log.e(TAG, "Ошибка регистрации JmDNS", e);
        }
    }

    public void unregisterService() {
        Log.d(TAG, "JmDNS запущена остановка");
        for (var j : jmdns) {
            try {
                if (j != null) {
                    j.unregisterAllServices();
                    j.close();
                    Log.d(TAG, "JmDNS остановлен");
                }
            } catch (Exception e) {
                Log.e(TAG, "Ошибка при остановке JmDNS", e);
            }
        }
        jmdns.clear();
    }
}


package ru.asavan.sosgame;

import static ru.asavan.sosgame.AndroidWebServerActivity.MAIN_LOG_TAG;

import android.content.Context;
import android.net.wifi.WifiManager;
import android.util.Log;
import java.io.IOException;
import java.net.InetAddress;

import javax.jmdns.JmDNS;
import javax.jmdns.ServiceInfo;

import android.net.ConnectivityManager;
import android.net.LinkAddress;
import android.net.LinkProperties;
import android.net.Network;
import android.net.NetworkCapabilities;

import java.net.Inet4Address;

public class MvMdnsManager {
    private static final String TAG = MAIN_LOG_TAG;

    private JmDNS jmdns;
    private WifiManager.MulticastLock multicastLock;

    public void registerService(Context context, String name, int port) {

        // 1. Включаем MulticastLock
        WifiManager wifi = (WifiManager) context.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        if (wifi != null) {
            multicastLock = wifi.createMulticastLock("jmdns_lock");
            multicastLock.setReferenceCounted(true);
            multicastLock.acquire();
        }

        // 2. Регистрация в фоновом потоке
        new Thread(() -> {
            try {
                // Получаем IP-адрес через современный ConnectivityManager
                InetAddress bindingAddress = getWifiIpAddress(context);

                if (bindingAddress == null) {
                    Log.e(TAG, "Не удалось получить IP-адрес Wi-Fi. Устройство подключено к сети?");
                    return;
                }

                Log.d(TAG, "Binding JmDNS to IP: " + bindingAddress.getHostAddress());

                // Создаем JmDNS на базе актуального IP
                jmdns = JmDNS.create(bindingAddress, name);
                ServiceInfo serviceInfo = ServiceInfo.create("_http._tcp.local.", name, port, "path=index.html");
                jmdns.registerService(serviceInfo);
                Log.d(TAG, "Служба успешно зарегистрирована через JmDNS: " + name);
            } catch (IOException e) {
                Log.e(TAG, "Ошибка регистрации JmDNS", e);
            }
        }).start();
    }

    /**
     * Современный способ получения IPv4 адреса Wi-Fi интерфейса
     */
    private InetAddress getWifiIpAddress(Context context) {
        ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return null;

        // Получаем активную сеть
        Network activeNetwork = cm.getActiveNetwork();
        if (activeNetwork == null) return null;

        // Проверяем, что это именно Wi-Fi (а не мобильная сеть или VPN)
        NetworkCapabilities caps = cm.getNetworkCapabilities(activeNetwork);
        if (caps == null || !caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
            return null;
        }

        // Извлекаем свойства линка (адреса)
        LinkProperties linkProperties = cm.getLinkProperties(activeNetwork);
        if (linkProperties == null) return null;

        // Ищем IPv4 адрес среди всех назначенных интерфейсу
        for (LinkAddress linkAddress : linkProperties.getLinkAddresses()) {
            InetAddress address = linkAddress.getAddress();
            if (address instanceof Inet4Address && !address.isLoopbackAddress()) {
                return address;
            }
        }
        return null;
    }

    public void unregisterService() {
        Log.d(TAG, "JmDNS запущена остановка");
        new Thread(() -> {
            try {
                if (jmdns != null) {
                    jmdns.unregisterAllServices();
                    jmdns.close();
                    jmdns = null;
                    Log.d(TAG, "JmDNS остановлен");
                }
                if (multicastLock != null && multicastLock.isHeld()) {
                    multicastLock.release();
                    multicastLock = null;
                }
            } catch (Exception e) {
                Log.e(TAG, "Ошибка при остановке JmDNS", e);
            }
        }).start();
    }
}


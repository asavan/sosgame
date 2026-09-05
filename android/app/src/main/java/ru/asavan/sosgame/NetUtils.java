package ru.asavan.sosgame;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.LinkAddress;
import android.net.LinkProperties;
import android.net.Network;
import android.net.NetworkCapabilities;

import java.net.Inet4Address;
import java.net.InetAddress;

public class NetUtils {
    /**
     * Современный способ получения IPv4 адреса Wi-Fi интерфейса
     */
    public static InetAddress getWifiIpAddress(Context context) {
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
}

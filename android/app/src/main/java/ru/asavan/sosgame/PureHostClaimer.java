package ru.asavan.sosgame;

import android.content.Context;
import android.net.wifi.WifiManager;
import android.util.Log;
import javax.jmdns.JmDNS;
import java.io.IOException;
import java.net.InetAddress;

public class PureHostClaimer {
    private static final String TAG = "PureMdnsClaim";
    private JmDNS jmdnsInstance;
    private WifiManager.MulticastLock multicastLock;

    public void claimHostOnly(Context context, InetAddress androidIp, String desiredHostName) {
        try {
            // КРИТИЧЕСКИ ВАЖНО ДЛЯ ANDROID:
            // По умолчанию Android блокирует многоадресный (Multicast) трафик для экономии батареи.
            // Без этого замка jMDNS просто не услышит запросы из сети!
            WifiManager wm = (WifiManager) context.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wm != null) {
                multicastLock = wm.createMulticastLock("mDnsLock");
                multicastLock.setReferenceCounted(true);
                multicastLock.acquire(); // Разрешаем mDNS-трафик
            }

            // Инициализируем jMDNS. Это действие СРАЗУ делает mdns.claimHost()
            // Оно привязывает ваш IP к адресу desiredHostName.local
            jmdnsInstance = JmDNS.create(androidIp, desiredHostName);

            // Проверяем, какое имя в итоге закрепилось за устройством
            // (Если "pretty" было занято, jMDNS сама переименует его, например, в "pretty-2")
            Log.d(TAG, "Хост успешно заявлен в сеть! Адрес: http://" + jmdnsInstance.getName() + ".local");

        } catch (IOException e) {
            Log.e(TAG, "Ошибка при создании jMDNS инстанса", e);
        }
    }

    // Обязательно вызывайте при закрытии приложения, чтобы не вешать сеть и не сажать батарею!
    public void releaseHost() {
        try {
            if (jmdnsInstance != null) {
                jmdnsInstance.close();
                jmdnsInstance = null;
            }
            if (multicastLock != null && multicastLock.isHeld()) {
                multicastLock.release();
                multicastLock = null;
            }
            Log.d(TAG, "mDNS хост успешно закрыт и ресурсы освобождены.");
        } catch (IOException e) {
            Log.e(TAG, "Ошибка при закрытии jMDNS", e);
        }
    }
}


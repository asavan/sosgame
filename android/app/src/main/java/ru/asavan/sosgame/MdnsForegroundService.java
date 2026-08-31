package ru.asavan.sosgame;

import static ru.asavan.sosgame.AndroidWebServerActivity.MAIN_LOG_TAG;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.LinkAddress;
import android.net.LinkProperties;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.wifi.WifiManager;
import android.os.Binder;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import androidx.core.app.NotificationCompat;

import java.io.IOException;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.util.HashMap;

import javax.jmdns.JmDNS;
import javax.jmdns.ServiceInfo;

public class MdnsForegroundService extends Service {
    private static final String TAG = MAIN_LOG_TAG;
    private static final String CHANNEL_ID = "mdns_channel";
    private static final int NOTIFICATION_ID = 100;

    private JmDNS jmdns;
    private WifiManager.MulticastLock multicastLock;
    private ServiceInfo serviceInfo;

    @Override
    public void onCreate() {
        super.onCreate();
        // Отключаем внутренние размашистые логи JmDNS, чтобы не спамить в Logcat

        Log.d(TAG, "startMdnsAdvertising ");
        // 1. Активируем MulticastLock (в Foreground Service это сработает на 100%)
        WifiManager wifi = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        if (wifi != null) {
            multicastLock = wifi.createMulticastLock("mdns_fg_lock");
            multicastLock.setReferenceCounted(false); // Жесткий захват без подсчета ссылок
            multicastLock.acquire();
        }

        try {
            Log.d(TAG, "startMdnsAdvertising2 ");
            InetAddress ip = getWifiIpAddress(this);
            if (ip == null) {
                Log.e(TAG, "Ошибка: Устройство не подключено к Wi-Fi подсети.");
                return;
            }

            Log.d(TAG, "Биндинг JmDNS на IP-адрес: " + ip.getHostAddress());
            jmdns = JmDNS.create(ip, ip.getHostAddress());

            // Обязательные метаданные (TXT Record) для стабильного распознавания сканерами
            HashMap<String, String> properties = new HashMap<>();
            properties.put("status", "active");

            // Создаем структуру сервиса (тип строго должен заканчиваться на .local.)
            serviceInfo = ServiceInfo.create(
                    "_http._tcp.local",
                    "MyCoolDevice",
                    8080,
                    0, 0,
                    properties
            );

            // Публикуем в сеть
            jmdns.registerService(serviceInfo);
            Log.d(TAG, "Домен успешно опубликован в сети!");

        } catch (IOException e) {
            Log.e(TAG, "Критическая ошибка JmDNS при регистрации", e);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i(MAIN_LOG_TAG, "onStartCommand 1");
        try {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "ChannelN", NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("channel for foreground service notification");

            var notificationManager = getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);


            // Создаем обязательное системное уведомление
            Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                    .setContentTitle(getString(R.string.app_name))
                    .setContentText("Публикация домена в локальной сеть...")
                    .setSmallIcon(android.R.drawable.ic_menu_share)
                    .setPriority(NotificationCompat.PRIORITY_LOW)
                    .build();

            // Запуск службы на переднем плане с указанием типа для Android 14+
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                Log.i(TAG, "startForeground1");
                startForeground(NOTIFICATION_ID, notification,
                        android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE);
            } else {
                Log.e(TAG, "WTF");
                startForeground(NOTIFICATION_ID, notification);
            }
        } catch (Exception ex) {
            Log.e(TAG, "onStartCommand fail", ex);
        }
        return super.onStartCommand(intent, flags, startId);
        // return START_STICKY;
    }

    /**
     * Современный (Non-deprecated) метод получения IPv4 адреса Wi-Fi интерфейса
     */
    private InetAddress getWifiIpAddress(Context context) {
        ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return null;

        Network activeNetwork = cm.getActiveNetwork();
        if (activeNetwork == null) return null;

        NetworkCapabilities caps = cm.getNetworkCapabilities(activeNetwork);
        if (caps == null || !caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) return null;

        LinkProperties linkProperties = cm.getLinkProperties(activeNetwork);
        if (linkProperties == null) return null;

        for (LinkAddress linkAddress : linkProperties.getLinkAddresses()) {
            InetAddress address = linkAddress.getAddress();
            if (address instanceof Inet4Address && !address.isLoopbackAddress()) {
                return address;
            }
        }
        return null;
    }

    private void createNotificationChannel() {
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID, "mDNS Service Channel", NotificationManager.IMPORTANCE_HIGH);
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.createNotificationChannel(channel);
        } else {
            Log.d(TAG, "No NotificationManager");
        }
    }

    @Override
    public void onDestroy() {
        Log.i(MAIN_LOG_TAG, "Destroy service");
        try {
            if (jmdns != null) {
                // JmDNS рассылает Goodbye-пакеты, чтобы ПК мгновенно забыл это устройство
                jmdns.unregisterAllServices();
                jmdns.close();
                jmdns = null;
                Log.d(TAG, "Ресурсы JmDNS успешно очищены.");
            }
        } catch (Exception e) {
            Log.e(TAG, "Ошибка при закрытии сокетов JmDNS", e);
        } finally {
            // Всегда гарантированно отпускаем блокировку мультикаста
            if (multicastLock != null && multicastLock.isHeld()) {
                multicastLock.release();
                multicastLock = null;
            }
        }

        // Вызываем родительский метод только после того, как все Goodbye-пакеты ушли в сеть
        super.onDestroy();
    }

    public class LocalBinder extends Binder {
        MdnsForegroundService getService() {
            // Return this instance of LocalService so clients can call public methods
            return MdnsForegroundService.this;
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return mBinder;
    }

    private final IBinder mBinder = new LocalBinder();
}


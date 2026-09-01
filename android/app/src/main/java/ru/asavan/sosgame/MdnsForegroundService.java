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
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MdnsForegroundService extends Service {
    private static final String TAG = MAIN_LOG_TAG;
    private static final String CHANNEL_ID = "mdns_channel";
    private static final int NOTIFICATION_ID = 100;

    private PureHostClaimer pureHostClaimer;
    private ExecutorService networkExecutor;

    @Override
    public void onCreate() {
        super.onCreate();
        pureHostClaimer = new PureHostClaimer();
        networkExecutor = Executors.newSingleThreadExecutor();
        // Отключаем внутренние размашистые логи JmDNS, чтобы не спамить в Logcat

        Log.d(TAG, "startMdnsAdvertising ");
        // 1. Активируем MulticastLock (в Foreground Service это сработает на 100%)


    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i(MAIN_LOG_TAG, "onStartCommand 1");

        InetAddress ip = getWifiIpAddress(this);
        if (ip == null) {
            Log.e(TAG, "Ошибка: Устройство не подключено к Wi-Fi подсети.");
            super.onStartCommand(intent, flags, startId);
        }


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

            var self = this;

            // 2. Отправляем сетевую задачу в фоновый поток
            networkExecutor.execute(new Runnable() {
                @Override
                public void run() {
                    try {
                        // Получаем локальный IP-адрес Wi-Fi
                        Log.d(TAG, "Биндинг JmDNS на IP-адрес: " + ip.getHostAddress());
                        pureHostClaimer.claimHostOnly(getApplicationContext(), ip, "pretty");
                        Log.d(TAG, "Домен успешно опубликован в сети!");

                    } catch (Exception e) {
                        Log.e(TAG, "Ошибка инициализации mDNS в фоновом потоке", e);
                    }
                }
            });
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


    @Override
    public void onDestroy() {
        Log.i(MAIN_LOG_TAG, "Destroy service");
        if (networkExecutor != null) {
            networkExecutor.execute(() -> {
                if (pureHostClaimer != null) {
                    pureHostClaimer.releaseHost();
                }
            });
            // Закрываем сам исполнитель потоков после завершения задачи

            // Вызываем родительский метод только после того, как все Goodbye-пакеты ушли в сеть
            networkExecutor.shutdown();
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}

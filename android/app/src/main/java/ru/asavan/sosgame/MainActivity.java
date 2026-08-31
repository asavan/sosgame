package ru.asavan.sosgame;

import android.app.Activity;
import android.content.Context;
import android.net.nsd.NsdManager;
import android.net.nsd.NsdServiceInfo;
import android.os.Bundle;
import android.util.Log;

public class MainActivity extends Activity {

    private static final String TAG = "mDNS_Advertiser";

    // Задаем имя, по которому нас будут искать (coolgames.local)
    private static final String SERVICE_NAME = "coolgames";
    // Тип сервиса. Измените на ваш (например, _game._tcp), если это не HTTP
    // _websocket._tcp.
    private static final String SERVICE_TYPE = "_http._tcp."; // _websocket._tcp.
    // Порт, на котором слушает ваш локальный сервер внутри приложения
    private static final int SERVICE_PORT = 8080;

    private NsdManager nsdManager;
    private NsdManager.RegistrationListener registrationListener;
    private String registeredName;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.main);

        // Инициализируем менеджер сетевых сервисов
        nsdManager = (NsdManager) getSystemService(Context.NSD_SERVICE);

        // Запускаем анонс
        registerMdnsService();
    }

    private void registerMdnsService() {
        // 1. Создаем объект с информацией о нашем сервисе
        NsdServiceInfo serviceInfo = new NsdServiceInfo();
        serviceInfo.setServiceName(SERVICE_NAME);
        serviceInfo.setServiceType(SERVICE_TYPE);
        serviceInfo.setPort(SERVICE_PORT);

        // 2. Создаем слушатель жизненного цикла регистрации
        registrationListener = new NsdManager.RegistrationListener() {
            @Override
            public void onServiceRegistered(NsdServiceInfo NsdServiceInfo) {
                // Если имя "coolgames" уже занято в сети, Android автоматически переименует его (например, "coolgames (1)")
                registeredName = NsdServiceInfo.getServiceName();
                Log.d(TAG, "Успешно зарегистрировано имя mDNS: " + registeredName);
            }

            @Override
            public void onRegistrationFailed(NsdServiceInfo serviceInfo, int errorCode) {
                Log.e(TAG, "Ошибка регистрации mDNS. Код ошибки: " + errorCode);
            }

            @Override
            public void onServiceUnregistered(NsdServiceInfo arg0) {
                Log.d(TAG, "Анонс mDNS успешно остановлен.");
            }

            @Override
            public void onUnregistrationFailed(NsdServiceInfo serviceInfo, int errorCode) {
                Log.e(TAG, "Не удалось остановить анонс. Код ошибки: " + errorCode);
            }
        };

        // 3. Публикуем сервис в локальную сеть
        try {
            nsdManager.registerService(serviceInfo, NsdManager.PROTOCOL_DNS_SD, registrationListener);
        } catch (Exception e) {
            Log.e(TAG, "Исключение при регистрации сервиса", e);
        }
    }

    @Override
    protected void onDestroy() {
        // ОБЯЗАТЕЛЬНО отключаем анонс при закрытии, чтобы не засорять сеть и не тратить батарею
        if (nsdManager != null && registrationListener != null) {
            try {
                nsdManager.unregisterService(registrationListener);
            } catch (IllegalArgumentException e) {
                Log.w(TAG, "Сервис не был зарегистрирован или уже удален", e);
            }
        }
        super.onDestroy();
    }
}

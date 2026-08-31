package ru.asavan.sosgame;

import android.app.Activity;
import android.content.Context;
import android.net.nsd.NsdManager;
import android.net.nsd.NsdServiceInfo;
import android.os.Bundle;
import android.util.Log;

public class MainActivity2 extends Activity {

    private static final String TAG = "mDNS_Registration";
    private static final String SERVICE_TYPE = "_http._tcp."; // Тип службы (например, для веб-сервера)
    private static final int PORT = 8080;

    private NsdManager nsdManager;
    private NsdManager.RegistrationListener coolGamesListener;
    private NsdManager.RegistrationListener myGameListener;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.main);

        // Инициализируем NsdManager
        nsdManager = (NsdManager) getSystemService(Context.NSD_SERVICE);

        // Регистрируем оба имени
        registerMdnsService("coolgames", coolGamesListener = createRegistrationListener("coolgames"));
        registerMdnsService("mygame", myGameListener = createRegistrationListener("mygame"));
    }

    private void registerMdnsService(String serviceName, NsdManager.RegistrationListener listener) {
        NsdServiceInfo serviceInfo = new NsdServiceInfo();
        serviceInfo.setServiceName(serviceName);
        serviceInfo.setServiceType(SERVICE_TYPE);
        serviceInfo.setPort(PORT);

        try {
            nsdManager.registerService(serviceInfo, NsdManager.PROTOCOL_DNS_SD, listener);
        } catch (Exception e) {
            Log.e(TAG, "Ошибка при регистрации службы " + serviceName, e);
        }
    }

    // Фабрика слушателей для отслеживания статуса регистрации
    private NsdManager.RegistrationListener createRegistrationListener(final String name) {
        return new NsdManager.RegistrationListener() {
            @Override
            public void onServiceRegistered(NsdServiceInfo NsdServiceInfo) {
                // В локальной сети устройство станет доступно как name.local
                Log.i(TAG, "Служба успешно зарегистрирована: " + NsdServiceInfo.getServiceName());
            }

            @Override
            public void onRegistrationFailed(NsdServiceInfo serviceInfo, int errorCode) {
                Log.e(TAG, "Ошибка регистрации службы " + name + ". Код ошибки: " + errorCode);
            }

            @Override
            public void onServiceUnregistered(NsdServiceInfo serviceInfo) {
                Log.i(TAG, "Служба отключена: " + serviceInfo.getServiceName());
            }

            @Override
            public void onUnregistrationFailed(NsdServiceInfo serviceInfo, int errorCode) {
                Log.e(TAG, "Ошибка при отключении службы " + name + ". Код ошибки: " + errorCode);
            }
        };
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // Обязательно освобождаем ресурсы при закрытии приложения
        if (nsdManager != null) {
            if (coolGamesListener != null) nsdManager.unregisterService(coolGamesListener);
            if (myGameListener != null) nsdManager.unregisterService(myGameListener);
        }
    }
}
package ru.asavan.sosgame;

import android.app.Activity;
import android.content.Context;
import android.net.nsd.NsdManager;
import android.net.nsd.NsdServiceInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.ext.SdkExtensions;
import android.util.Log;

import java.util.ArrayList;
import java.util.List;

public class MdnsUtils {
    private NsdManager nsdManager;

    private String TAG = "mDNS_Registration";
    private static final String SERVICE_TYPE = "_http._tcp"; // Тип службы (например, для веб-сервера)
    private int PORT = 8080;

    List<NsdManager.RegistrationListener> listenerList = new ArrayList<>();
    WifiManager.MulticastLock lock;


    public MdnsUtils(Activity activity, String tag, int port) {
        this(activity, tag);
        PORT = port;
    }

    public MdnsUtils(Activity activity, String tag) {
        nsdManager = (NsdManager) activity.getApplicationContext().getSystemService(Context.NSD_SERVICE);
        TAG = tag;

        WifiManager wifi = (WifiManager) activity.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        lock = wifi.createMulticastLock("mylock");
        lock.setReferenceCounted(true);
        lock.acquire();
    }

    public void setPort(int port) {
        this.PORT = port;
    }

    private NsdManager.RegistrationListener createRegistrationListener(final String name) {
        return new NsdManager.RegistrationListener() {
            @Override
            public void onServiceRegistered(NsdServiceInfo NsdServiceInfo) {
                // В локальной сети устройство станет доступно как name.local
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && SdkExtensions.getExtensionVersion(Build.VERSION_CODES.TIRAMISU) >= 7) {
                    Log.i(TAG, "Служба успешно зарегистрирована: " + NsdServiceInfo.getServiceName() + " " + NsdServiceInfo.getHostAddresses().size());
                }
                nsdManager.discoverServices("_http._tcp", NsdManager.PROTOCOL_DNS_SD, new NsdManager.DiscoveryListener() {
                    @Override
                    public void onDiscoveryStarted(String serviceType) {
                        // Даем поработать 2 секунды и останавливаем, чтобы не тратить батарею
                        new Handler(Looper.getMainLooper()).postDelayed(() -> {
                            try { nsdManager.stopServiceDiscovery(this); } catch (Exception e) {}
                        }, 2000);
                    }
                    // Остальные пустые методы колбэка...
                    @Override public void onServiceFound(NsdServiceInfo s) {}
                    @Override public void onServiceLost(NsdServiceInfo s) {}
                    @Override public void onDiscoveryStopped(String s) {}
                    @Override public void onStartDiscoveryFailed(String s, int e) {}
                    @Override public void onStopDiscoveryFailed(String s, int e) {}
                });
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

    public NsdManager.RegistrationListener registerMdnsService(String serviceName) {
        var listener = createRegistrationListener(serviceName);
        registerMdnsService(serviceName, listener);
        listenerList.add(listener);
        return listener;
    }

    public void registerMdnsService(String serviceName, NsdManager.RegistrationListener listener) {
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

    public void onDestroy() {
        if (nsdManager != null) {
            for (var listener : listenerList) {
                if (listener != null) {
                    nsdManager.unregisterService(listener);
                }
            }
        }
        if (lock != null) {
            lock.release();
        }
        nsdManager = null;
    }
}

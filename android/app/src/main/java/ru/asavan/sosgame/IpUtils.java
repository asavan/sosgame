package ru.asavan.sosgame;

import android.util.Log;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;

public class IpUtils {

    public static final String LOCAL_IP = "127.0.0.1";
    public static final String LOCALHOST = "localhost";


    public static String getIPAddress() {
        try {
            for (var interfaces = NetworkInterface.getNetworkInterfaces();
                 interfaces.hasMoreElements(); ) {
                NetworkInterface interface_ = interfaces.nextElement();
                for (var addrs = interface_.getInetAddresses(); addrs.hasMoreElements(); ) {
                    InetAddress inetAddress = addrs.nextElement();
                    if (inetAddress.isLoopbackAddress()) {
                        continue;
                    }
                    if (inetAddress instanceof Inet4Address ip4Addr) {
                        return ip4Addr.getHostAddress();
                    }
                }
            }
        } catch (Exception e) {
            Log.e("IP_LOG_TAG", "getIPAddress", e);
        }
        return null;
    }

    public static String getIPAddressSafe() {
        String formattedIpAddress = getIPAddress();
        if (formattedIpAddress != null) {
            return formattedIpAddress;
        }
        return LOCAL_IP;
    }
}

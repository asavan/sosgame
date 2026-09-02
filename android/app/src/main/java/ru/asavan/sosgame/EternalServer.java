package ru.asavan.sosgame;

import static ru.asavan.sosgame.AndroidWebServerActivity.MAIN_LOG_TAG;

import android.content.Context;
import android.util.Log;

import java.io.IOException;
import java.net.ServerSocket;

import fi.iki.elonen.NanoHTTPD;

abstract public class EternalServer extends WebServer {
    public EternalServer(Context context, int port) {
        super(context, port);
        this.setServerSocketFactory(new NanoHTTPD.ServerSocketFactory() {
            @Override
            public ServerSocket create() throws IOException {
                // Создаем сокет на порту, который был передан в конструктор
                ServerSocket serverSocket = new ServerSocket(port);

                // Предотвращает ошибку "Address already in use" при перезапусках
                serverSocket.setReuseAddress(true);

                // Бесконечное ожидание подключений (защита от "тихого" засыпания)
                serverSocket.setSoTimeout(0);

                return serverSocket;
            }
        });
    }
    @Override
    protected ClientHandler createClientHandler(final java.net.Socket finalAccept, final java.io.InputStream inputStream) {
        try {
            // Включаем TCP Keep-Alive для конкретного подключения.
            // Теперь ОС будет слать проверочные пакеты и не закроет соединение ради экономии батареи.
            finalAccept.setKeepAlive(true);

            // Задаем таймаут на чтение данных (например, 30 секунд)
            finalAccept.setSoTimeout(30000);
        } catch (Exception e) {
            Log.e(MAIN_LOG_TAG, "createClientHandler ERROR", e);
        }

        return super.createClientHandler(finalAccept, inputStream);
    }
}

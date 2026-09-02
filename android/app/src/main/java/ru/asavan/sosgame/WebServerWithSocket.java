package ru.asavan.sosgame;

import android.content.Context;
import android.util.Log;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import static ru.asavan.sosgame.AndroidWebServerActivity.MAIN_LOG_TAG;

import fi.iki.elonen.NanoHTTPD;

public class WebServerWithSocket extends WebServerWithUserFolder implements IWebSocketServer {
    private final List<WebSocket> list;
    private final ScheduledExecutorService executor = Executors.newScheduledThreadPool(1);

    public WebServerWithSocket(Context context, int port) {
        super(context, port);
        list = new ArrayList<>();
    }

    @Override
    public void start() throws IOException {
        super.start(NanoHTTPD.SOCKET_READ_TIMEOUT, false);
        startHeartbeat();
    }

    private void startHeartbeat() {
        // Send a ping frame to the client every 5-10 seconds
        executor.scheduleWithFixedDelay(() -> {
            synchronized (this) {
                for (WebSocket ws : list) {
                    try {
                        // Send an empty ping frame (Opcode 0x9)
                        ws.ping(new byte[0]);
                    } catch (IOException e) {
                        // If sending fails, the socket is dead; force close it cleanly
                        try {
                            ws.close(WebSocketFrame.CloseCode.NormalClosure, "Ping failed", false);
                        } catch (IOException ignored) {
                        }
                    }
                }
            }
        }, 3, 3, TimeUnit.SECONDS);
    }

    @Override
    protected WebSocket openWebSocket(IHTTPSession handshake) {
        return new DumbWebSocket(handshake, this);
    }

    @Override
    public void stop() {
        try {
            executor.shutdown();
            disconectAll();
            var terminated = executor.awaitTermination(5, TimeUnit.SECONDS);
            Log.i(MAIN_LOG_TAG, "termination status " + terminated);
        } catch (Exception ex) {
            Log.e(MAIN_LOG_TAG, "error on stop", ex);
        }
        super.stop();
    }

    public synchronized void addUser(WebSocket user) {
        list.add(user);
    }

    public synchronized void removeUser(WebSocket user) {
        list.remove(user);
    }

    public synchronized void broadcast(WebSocket sender, WebSocketFrame message) {
        try {
            message.setUnmasked();
            for (WebSocket ws : list) {
                if (ws != sender) {
                    ws.sendFrame(message);
                }
            }
        } catch (IOException e) {
            Log.e(MAIN_LOG_TAG, "broadcast fail", e);
            throw new RuntimeException(e);
        }
    }

    private synchronized void disconectAll() {
        for (WebSocket ws : list) {
            try {
                ws.close(WebSocketFrame.CloseCode.NormalClosure, "exit", false);
            } catch (Exception e) {
                Log.e(MAIN_LOG_TAG, "disconectAll fail", e);
            }
        }
        list.clear();
    }
}

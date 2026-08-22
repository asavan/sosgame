package ru.asavan.sosgame;

import android.content.Context;
import android.util.Log;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import fi.iki.elonen.NanoHTTPD;
import fi.iki.elonen.NanoWSD;

public class WebServer extends NanoWSD implements IWebSocketServer {


    public static final String MAIN_LOG_TAG = "WEBSERVER_TAG";

    private final List<WebSocket> list;

    private final Context context;
    private final String folderToServe;
    private static final String DEFAULT_STATIC_FOLDER = "www";

    private final ScheduledExecutorService executor = Executors.newScheduledThreadPool(1);


    public WebServer(Context context, int port, String folderToServe) {
        super(port);
        this.context = context;
        this.folderToServe = folderToServe;
        list = new ArrayList<>();

        var testEx = getMimeTypeForFile("index.html");
        Log.i(MAIN_LOG_TAG, "mime after init " + testEx);
        startHeartbeat();
    }

    public WebServer(Context context, int port) {
        this(context, port, DEFAULT_STATIC_FOLDER);
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
    protected Response serveHttp(final IHTTPSession session) {
        String orig = session.getUri();
        Log.i(MAIN_LOG_TAG, "try serve " + orig);
        if (session.getMethod() != Method.GET) {
            Log.i(MAIN_LOG_TAG, "not found");
            return notFound();
        }
        Log.i(MAIN_LOG_TAG, "try serve2");
        String file = session.getUri();
        if ("/".equals(file)) {
            file = "index.html";
        }

        if (file.startsWith("/")) {
            file = file.substring(1);
        }
        if (file.startsWith(".")) {
            file = file.substring(1);
        }

        String fileWithFolder = folderToServe + "/" + file;
        try {
            InputStream is = context.getResources().getAssets().open(fileWithFolder);
            var mimeType = getMimeTypeForFile(file);
            Log.i(MAIN_LOG_TAG, "serve as " + mimeType + " " + orig + " " + file);
            var result = newChunkedResponse(Response.Status.OK, mimeType, is);
            Log.i(MAIN_LOG_TAG, "served");
            return result;
        } catch (IOException e) {
            Log.e(MAIN_LOG_TAG, "AndroidStaticAssetsServer", e);
        }
        Log.i(MAIN_LOG_TAG, "not found2");
        return notFound();
    }

    private static Response notFound() {
        return newFixedLengthResponse(Response.Status.NOT_FOUND, NanoHTTPD.MIME_PLAINTEXT, "Not Found");
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

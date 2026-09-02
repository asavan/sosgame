package ru.asavan.sosgame;

import android.content.Context;
import android.util.Log;

import java.io.IOException;
import java.io.InputStream;

import fi.iki.elonen.NanoHTTPD;
import fi.iki.elonen.NanoWSD;

import static ru.asavan.sosgame.AndroidWebServerActivity.MAIN_LOG_TAG;

import androidx.annotation.NonNull;

abstract public class WebServer extends NanoWSD implements IStartStopServer {
    private final Context context;
    private final String folderToServe;
    private static final String DEFAULT_STATIC_FOLDER = "www";

    public WebServer(Context context, int port, String folderToServe) {
        super(port);
        this.context = context;
        this.folderToServe = folderToServe;

        var testEx = getMimeTypeForFile("index.html");
        Log.i(MAIN_LOG_TAG, "mime after init " + testEx);
    }

    public WebServer(Context context, int port) {
        this(context, port, DEFAULT_STATIC_FOLDER);
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

        return getResponse(file);
    }

    @NonNull
    protected Response getResponse(String file) {
        String fileWithFolder = folderToServe + "/" + file;
        try {
            InputStream is = context.getResources().getAssets().open(fileWithFolder);
            var mimeType = getMimeTypeForFile(file);
            var result = newChunkedResponse(Response.Status.OK, mimeType, is);
            Log.i(MAIN_LOG_TAG, "served");
            return result;
        } catch (IOException e) {
            Log.e(MAIN_LOG_TAG, "AndroidStaticAssetsServer", e);
        }
        Log.i(MAIN_LOG_TAG, "not found2");
        return notFound();
    }

    protected Context getContext() {
        return context;
    }

    protected static Response notFound() {
        return newFixedLengthResponse(Response.Status.NOT_FOUND, NanoHTTPD.MIME_PLAINTEXT, "Not Found");
    }
}

package ru.asavan.sosgame;

import android.content.Context;
import android.util.Log;

import java.io.IOException;

import fi.iki.elonen.NanoHTTPD;
import fi.iki.elonen.NanoWSD;
import ru.asavan.sosgame.providers.StaticResourceProvider;

import static ru.asavan.sosgame.AndroidWebServerActivity.MAIN_LOG_TAG;

import androidx.annotation.NonNull;

abstract public class WebServer extends NanoWSD implements ISetTreeServer {
    private final Context context;
    private static final String DEFAULT_STATIC_FOLDER = "www";

    private IResourceProvider resourceProvider;

    private boolean allowDots = true;

    public WebServer(Context context, int port, String folderToServe) {
        super(port);
        this.context = context;
        this.resourceProvider = new StaticResourceProvider(context, folderToServe);

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
        IResourceProvider localProvider = getResourceProvider();
        if (localProvider == null) {
            Log.i(MAIN_LOG_TAG, "no provider yet");
            return inTransition();
        }
        Log.i(MAIN_LOG_TAG, "try serve2 " + localProvider.name());
        String file = session.getUri();
        if ("/".equals(file) && localProvider.needExpandIndex()) {
            file = "index.html";
        }

        if (file.startsWith("/")) {
            file = file.substring(1);
        }
        if (!allowDots && file.startsWith(".")) {
            file = file.substring(1);
        }

        return getResponse(file, localProvider);
    }

    @NonNull
    protected Response getResponse(String file, IResourceProvider localProvider) {
        try {
            var res = localProvider.getResource(file);
            final String mimeType;
            if ("/".equals(file)) {
                mimeType = getMimeTypeForFile("index.html");
            } else {
                mimeType = getMimeTypeForFile(file);
            }
            if (res.hasSize()) {
                var result = newFixedLengthResponse(Response.Status.OK, mimeType, res.stream(), res.size());
                Log.i(MAIN_LOG_TAG, "served fixed");
                return result;
            } else {
                var result = newChunkedResponse(Response.Status.OK, mimeType, res.stream());
                Log.i(MAIN_LOG_TAG, "served stream");
                return result;
            }
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

    protected static Response inTransition() {
        return newFixedLengthResponse(Response.Status.CONFLICT, NanoHTTPD.MIME_PLAINTEXT, "In transition");
    }

    public synchronized IResourceProvider getResourceProvider() {
        return resourceProvider;
    }

    @Override
    public synchronized void setResourceProvider(IResourceProvider resourceProvider) {
        if (this.resourceProvider == resourceProvider) {
            return;
        }
        if (resourceProvider == null) {
            Log.i(MAIN_LOG_TAG, "Set null as resourceProvider");
        } else {
            Log.i(MAIN_LOG_TAG, "Set resourceProvider " + resourceProvider.name());
        }
        this.resourceProvider = resourceProvider;
    }
}

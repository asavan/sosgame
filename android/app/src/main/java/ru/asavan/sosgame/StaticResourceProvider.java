package ru.asavan.sosgame;

import android.content.Context;

import java.io.IOException;
import java.io.InputStream;

public class StaticResourceProvider implements IResourceProvider {
    private final Context context;
    private final String folderToServe;
    private static final String DEFAULT_STATIC_FOLDER = "www";

    public StaticResourceProvider(Context context, String folderToServe) {
        this.context = context;
        this.folderToServe = folderToServe;
    }
    public StaticResourceProvider(Context context) {
        this(context, DEFAULT_STATIC_FOLDER);
    }

    @Override
    public IStreaming getResource(String file) throws IOException {
        String fileWithFolder = folderToServe + "/" + file;
        InputStream is = context.getResources().getAssets().open(fileWithFolder);
        return new FileStream(is);
    }
}

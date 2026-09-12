package ru.asavan.sosgame;

import android.content.Context;
import android.net.Uri;

abstract public class WebServerWithUserFolder extends WebServer implements ISetTreeServer {
    public void setBaseTreeUri(Uri baseTreeUri) {
        if (baseTreeUri == null) {
            setResourceProvider(null);
            return;
        }
        IResourceProvider userProvider = new UserFolderResourceProvider(getContext(), baseTreeUri);
        setResourceProvider(userProvider);
    }

    public WebServerWithUserFolder(Context context, int port) {
        super(context, port);
    }
}

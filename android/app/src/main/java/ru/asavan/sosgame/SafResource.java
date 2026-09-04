package ru.asavan.sosgame;
import android.net.Uri;

import java.io.InputStream;
import java.util.Objects;

final class SafResource {
    private final InputStream inputStream;
    private final long size;
    private final Uri uriInStorage;

    SafResource(InputStream inputStream, long size, Uri uriInStorage) {
        this.inputStream = inputStream;
        this.size = size;
        this.uriInStorage = uriInStorage;
    }

    public InputStream inputStream() {
        return inputStream;
    }

    public long size() {
        return size;
    }

    public Uri uriInStorage() {
        return uriInStorage;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == this) return true;
        if (obj == null || obj.getClass() != this.getClass()) return false;
        var that = (SafResource) obj;
        return Objects.equals(this.inputStream, that.inputStream) &&
                this.size == that.size &&
                Objects.equals(this.uriInStorage, that.uriInStorage);
    }

    @Override
    public int hashCode() {
        return Objects.hash(inputStream, size, uriInStorage);
    }

    @Override
    public String toString() {
        return "SafResource[" +
                "inputStream=" + inputStream + ", " +
                "size=" + size + ", " +
                "uriInStorage=" + uriInStorage + ']';
    }
}

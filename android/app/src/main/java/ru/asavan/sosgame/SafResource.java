package ru.asavan.sosgame;
import java.io.InputStream;

public class SafResource {
    public final InputStream inputStream;
    public final long size;

    public SafResource(InputStream inputStream, long size) {
        this.inputStream = inputStream;
        this.size = size;
    }
}


package ru.asavan.sosgame;

import java.io.InputStream;

public class FileStream implements IStreaming {
    private final InputStream inputStream;

    public FileStream(InputStream inputStream) {
        this.inputStream = inputStream;
    }

    @Override
    public InputStream stream() {
        return inputStream;
    }
}

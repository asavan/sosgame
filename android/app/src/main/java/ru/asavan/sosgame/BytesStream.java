package ru.asavan.sosgame;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

public class BytesStream implements IStreaming {
    private final byte[] bytes;

    public BytesStream(byte[] bytes) {
        this.bytes = bytes;
    }

    @Override
    public InputStream stream() {
        return new ByteArrayInputStream(bytes);
    }

    @Override
    public boolean hasSize() {
        return true;
    }

    @Override
    public long size() {
        return bytes.length;
    }
}

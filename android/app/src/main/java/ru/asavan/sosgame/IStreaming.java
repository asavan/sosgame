package ru.asavan.sosgame;

import java.io.InputStream;

public interface IStreaming {
    InputStream stream();
    default boolean hasSize() {
        return false;
    }

    default long size() {
        return -1;
    }
}

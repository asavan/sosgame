package ru.asavan.sosgame;

import java.io.IOException;

public interface IResourceProvider {
    IStreaming getResource(String file) throws IOException;
}

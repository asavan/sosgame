package ru.asavan.sosgame;

import java.io.IOException;

public class TWAResourceProvider implements IResourceProvider {
    private final IDataGetter dataGetter;

    public TWAResourceProvider(IDataGetter dataGetter) {
        this.dataGetter = dataGetter;
    }

    @Override
    public IStreaming getResource(String file) throws IOException {
        var data = dataGetter.getData(file);
        return new BytesStream(data);
    }
}

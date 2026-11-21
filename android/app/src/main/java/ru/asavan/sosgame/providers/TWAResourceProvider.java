package ru.asavan.sosgame.providers;

import java.io.IOException;

import ru.asavan.sosgame.BytesStream;
import ru.asavan.sosgame.IDataGetter;
import ru.asavan.sosgame.IResourceProvider;
import ru.asavan.sosgame.IStreaming;

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

    @Override
    public boolean needExpandIndex() {
        return false;
    }

    @Override
    public String name() {
        return "twa";
    }
}

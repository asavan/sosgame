package ru.asavan.sosgame.neuro;

import org.json.JSONException;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;

import ru.asavan.sosgame.IDataSetter;

public class PlainTextHandler implements JsonMessageHandler {

    private final IDataSetter dataSetter;

    public PlainTextHandler(IDataSetter dataSetter) {
        this.dataSetter = dataSetter;
    }

    @Override
    public String getMessageType() {
        return "plaintext";
    }

    @Override
    public void handle(JSONObject payload) throws JSONException {
        String rawData = payload.getString("data");
        String name = payload.getString("name");
        var data = rawData.getBytes(StandardCharsets.UTF_8);
        dataSetter.putData(name, data);
    }
}


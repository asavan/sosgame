package ru.asavan.sosgame.neuro;

import android.util.Base64;

import org.json.JSONException;
import org.json.JSONObject;

import ru.asavan.sosgame.IDataSetter;

public class Base64Handler implements JsonMessageHandler {

    private final IDataSetter dataSetter;

    public Base64Handler(IDataSetter dataSetter) {
        this.dataSetter = dataSetter;
    }

    @Override
    public String getMessageType() {
        return "base64";
    }

    @Override
    public void handle(JSONObject payload) throws JSONException {
        String rawData = payload.getString("data");
        String name = payload.getString("name");
        var data = Base64.decode(rawData, Base64.DEFAULT);
        dataSetter.putData(name, data);
    }
}


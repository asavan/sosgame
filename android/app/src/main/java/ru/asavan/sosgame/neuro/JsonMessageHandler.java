package ru.asavan.sosgame.neuro;

import org.json.JSONException;
import org.json.JSONObject;

public interface JsonMessageHandler {
    String getMessageType();
    void handle(JSONObject payload) throws JSONException;
}

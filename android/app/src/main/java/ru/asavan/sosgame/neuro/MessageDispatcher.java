package ru.asavan.sosgame.neuro;

import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

public class MessageDispatcher {
    private final Map<String, JsonMessageHandler> handlers = new HashMap<>();

    public void registerHandler(JsonMessageHandler handler) {
        handlers.put(handler.getMessageType(), handler);
    }

    public void dispatch(String rawJson) {
        try {
            JSONObject json = new JSONObject(rawJson);
            String type = json.optString("type");

            JsonMessageHandler handler = handlers.get(type);
            if (handler != null) {
                handler.handle(json);
            }
        } catch (JSONException e) {
            Log.e("MAIN_LOG_TAG", "Already filled " + rawJson ,e);
        }
    }
}

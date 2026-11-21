package ru.asavan.sosgame.neuro;

import com.luigivampa92.ndefemulation.NdefEmulation;
import com.luigivampa92.ndefemulation.ndef.UriNdefData;

import org.json.JSONException;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;

import ru.asavan.sosgame.IDataSetter;

public class NfcHandler implements JsonMessageHandler {

    private final NdefEmulation ndefEmulation;


    public NfcHandler(NdefEmulation ndefEmulation) {
        this.ndefEmulation = ndefEmulation;
    }

    @Override
    public String getMessageType() {
        return "nfc";
    }

    @Override
    public void handle(JSONObject payload) throws JSONException {
        String url = payload.getString("data");
        ndefEmulation.setCurrentEmulatedNdefData(new UriNdefData(url));
    }
}


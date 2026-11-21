package ru.asavan.sosgame.neuro;

import org.json.JSONException;
import org.json.JSONObject;

import ru.asavan.sosgame.IMessageSender;
import ru.asavan.sosgame.IProviderSetter;
import ru.asavan.sosgame.providers.TWAResourceProvider;

public class BrowserServerHandler implements JsonMessageHandler {

    private final MessageDispatcher messageDispatcher;
    private final IProviderSetter providerSetter;
    private final IMessageSender messageSender;

    public BrowserServerHandler(MessageDispatcher messageDispatcher, IProviderSetter providerSetter, IMessageSender messageSender) {
        this.messageDispatcher = messageDispatcher;
        this.providerSetter = providerSetter;
        this.messageSender = messageSender;
    }

    @Override
    public String getMessageType() {
        return "browserserver";
    }

    @Override
    public void handle(JSONObject payload) throws JSONException {
        if (providerSetter == null) {
            return;
        }

        TwaDataBridge twaDataBridge = new TwaDataBridge(messageSender);
        messageDispatcher.registerHandler(new PlainTextHandler(twaDataBridge));
        messageDispatcher.registerHandler(new Base64Handler(twaDataBridge));
        var resourceProvider = new TWAResourceProvider(twaDataBridge);
        providerSetter.setResourceProvider(resourceProvider);
    }
}

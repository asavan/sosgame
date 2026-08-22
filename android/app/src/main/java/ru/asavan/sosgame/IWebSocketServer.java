package ru.asavan.sosgame;

import fi.iki.elonen.NanoWSD;

public interface IWebSocketServer {
    void addUser(NanoWSD.WebSocket user);

    void removeUser(NanoWSD.WebSocket user);

    void broadcast(NanoWSD.WebSocket sender, NanoWSD.WebSocketFrame message);
}

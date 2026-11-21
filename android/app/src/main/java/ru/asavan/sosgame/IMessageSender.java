package ru.asavan.sosgame;

import androidx.annotation.NonNull;

public interface IMessageSender {
    boolean postMessage(@NonNull String message);
}

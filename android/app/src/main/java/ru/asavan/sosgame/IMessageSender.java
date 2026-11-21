package ru.asavan.sosgame;

import androidx.annotation.NonNull;

public interface IMessageSender {
    int postMessage(@NonNull String message);
}

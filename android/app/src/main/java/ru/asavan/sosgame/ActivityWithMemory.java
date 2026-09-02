package ru.asavan.sosgame;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.Nullable;

public class ActivityWithMemory extends AndroidWebServerActivity {
    private SharedPreferences prefs;
    public static final String PREFS_NAME = "ServerPrefs";
    public static final String KEY_FOLDER_URI = "selected_folder_uri";

    private final ActivityResultLauncher<Uri> openDocumentTreeLauncher =
            registerForActivityResult(new ActivityResultContracts.OpenDocumentTree(), uri -> {
                if (uri != null) {
                    int takeFlags = Intent.FLAG_GRANT_READ_URI_PERMISSION;
                    getContentResolver().takePersistableUriPermission(uri, takeFlags);
                    prefs.edit().putString(KEY_FOLDER_URI, uri.toString()).apply();
                } else {
                    prefs.edit().remove(KEY_FOLDER_URI).apply();
                }
                setBaseTreeUri(uri);
            });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        // 1. При старте приложения достаем сохраненный Uri (если он есть)
        Uri savedUri = getSavedUri();

        // 2. Запускаем сервис с этим Uri (с автоматической проверкой разрешений)
        setBaseTreeUri(savedUri);

        // Кнопка выбора папки
        findViewById(R.id.other_game).setOnClickListener(v -> {
            Uri initialUri = getSavedUri();
            openDocumentTreeLauncher.launch(initialUri);
        });

        findViewById(R.id.clear).setOnClickListener(v -> {
            prefs.edit().remove(KEY_FOLDER_URI).apply();
            setBaseTreeUri(null);
        });
    }

    @Nullable
    private Uri getSavedUri() {
        String savedUriString = prefs.getString(KEY_FOLDER_URI, null);
        if (savedUriString == null) {
            Log.i(MAIN_LOG_TAG, "empty url restored");
            return null;
        }
        Log.i(MAIN_LOG_TAG, "url restored " + savedUriString);
        return Uri.parse(savedUriString);
    }
}

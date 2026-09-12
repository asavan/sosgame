package ru.asavan.sosgame.neuro;

import android.net.Uri;
import android.os.Bundle;
import android.widget.Button;
import android.widget.Toast;
import androidx.activity.ComponentActivity;
import androidx.browser.customtabs.CustomTabsSession;
import androidx.browser.trusted.TrustedWebActivityIntent;
import androidx.browser.trusted.TrustedWebActivityIntentBuilder;

import ru.asavan.sosgame.R;

public class MainActivity extends ComponentActivity {

    private TwaMessageBridgeCallback messageCallback;
    private TwaServiceConnection twaConnection;
    private TwaDataBridge currentDataBridge;

    // Ссылка на слушателя, чтобы иметь возможность отписать его при смене урла
    private TwaMessageBridgeCallback.PostMessageListener currentListener;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.main);

        Button btnSiteA = findViewById(R.id.ai);
        Button btnSiteB = findViewById(R.id.twa_127);
        Button btnGetData = findViewById(R.id.network_info);

        messageCallback = new TwaMessageBridgeCallback();
        twaConnection = new TwaServiceConnection(messageCallback);
        twaConnection.bind(this);

        btnSiteA.setOnClickListener(v -> launchTwa("https://site-a.com"));
        btnSiteB.setOnClickListener(v -> launchTwa("https://site-b.com"));

        btnGetData.setOnClickListener(v -> {
            if (currentDataBridge == null) {
                Toast.makeText(this, "Сначала откройте один из сайтов", Toast.LENGTH_SHORT).show();
                return;
            }

            new Thread(() -> {
                byte[] data = currentDataBridge.getData("config.json");
                runOnUiThread(() -> {
                    if (data != null) {
                        Toast.makeText(MainActivity.this, "Данные получены! Размер: " + data.length, Toast.LENGTH_LONG).show();
                    } else {
                        Toast.makeText(MainActivity.this, "Ошибка или таймаут портов связи", Toast.LENGTH_LONG).show();
                    }
                });
            }).start();
        });
    }

    private void launchTwa(String url) {
        CustomTabsSession session = twaConnection.getSession();
        if (session == null) {
            Toast.makeText(this, "TWA сервис еще загружается, подождите...", Toast.LENGTH_SHORT).show();
            return;
        }

        if (currentDataBridge != null) {
            currentDataBridge.clearCache();
        }

        // Создаем мост, передавая ТОЛЬКО messageCallback
        currentDataBridge = new TwaDataBridge(messageCallback);

        // Выполняем атомарный своп
        messageCallback.swapTargetAndListener(url, message -> currentDataBridge.processIncomingMessage(message));

        // Запускаем TWA
        Uri launchUri = Uri.parse(url);
        TrustedWebActivityIntentBuilder builder = new TrustedWebActivityIntentBuilder(launchUri);
        TrustedWebActivityIntent twaIntent = builder.build(session);
        twaIntent.launchTrustedWebActivity(this);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // Полная очистка ресурсов при выходе из приложения
        messageCallback.clear();
        twaConnection.unbind(this);
    }
}

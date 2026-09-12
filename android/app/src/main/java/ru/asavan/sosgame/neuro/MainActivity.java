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

    // Теперь храним ссылку на ТЕКУЩИЙ активный мост данных
    private TwaDataBridge currentDataBridge;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.main);

        Button btnSiteA = findViewById(R.id.ai);
        Button btnSiteB = findViewById(R.id.twa_127);
        Button btnGetData = findViewById(R.id.network_info);

        // 1. Инициализируем базовую инфраструктуру связи (один раз)
        messageCallback = new TwaMessageBridgeCallback();
        twaConnection = new TwaServiceConnection(messageCallback, session -> {
            runOnUiThread(() -> Toast.makeText(MainActivity.this, "TWA Сервис готов!", Toast.LENGTH_SHORT).show());
        });

        // 2. Биндимся к системному сервису Custom Tabs (один раз)
        twaConnection.bind(this);

        // 3. Клики по кнопкам сайтов
        btnSiteA.setOnClickListener(v -> launchTwa("https://site-a.com"));
        btnSiteB.setOnClickListener(v -> launchTwa("https://site-b.com"));

        // 4. Кнопка запроса данных обращается к тому мосту, который активен в данный момент
        btnGetData.setOnClickListener(v -> {
            // Защита: если мост еще не создан (пользователь не выбрал сайт)
            if (currentDataBridge == null) {
                Toast.makeText(this, "Сначала откройте один из сайтов", Toast.LENGTH_SHORT).show();
                return;
            }

            new Thread(() -> {
                // Запрос идет через текущий активный экземпляр моста (со своим кэшем)
                byte[] data = currentDataBridge.getData("config.json");

                runOnUiThread(() -> {
                    if (data != null) {
                        Toast.makeText(MainActivity.this, "Данные получены! Размер: " + data.length, Toast.LENGTH_LONG).show();
                    } else {
                        Toast.makeText(MainActivity.this, "Ошибка получения или таймаут", Toast.LENGTH_LONG).show();
                    }
                });
            }).start();
        });
    }

    /**
     * Переключает TWA на новый URL и создает для него СВЕЖИЙ экземпляр TwaDataBridge
     */
    private void launchTwa(String url) {
        CustomTabsSession session = twaConnection.getSession();
        if (session == null) {
            Toast.makeText(this, "Сервис еще загружается...", Toast.LENGTH_SHORT).show();
            return;
        }

        // 1. Освобождаем ресурсы старого моста данных
        if (currentDataBridge != null) {
            currentDataBridge.release();
        }

        // 2. Настраиваем callback на новый URL
        messageCallback.setTargetUrl(url);

        // 3. Создаем свежий экземпляр моста с чистым кэшем
        currentDataBridge = new TwaDataBridge(session, messageCallback);

        // 4. Правильный запуск TWA: сессия передается только в метод build()
        Uri launchUri = Uri.parse(url);
        TrustedWebActivityIntentBuilder builder = new TrustedWebActivityIntentBuilder(launchUri);

        TrustedWebActivityIntent twaIntent = builder.build(session);
        twaIntent.launchTrustedWebActivity(this);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (currentDataBridge != null) {
            currentDataBridge.release();
        }
        if (twaConnection != null) {
            twaConnection.unbind(this);
        }
    }
}

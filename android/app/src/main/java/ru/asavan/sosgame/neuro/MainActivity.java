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
import ru.asavan.sosgame.WebServerWithSocket;

public class MainActivity extends ComponentActivity {

    private TwaMessageBridgeCallback messageCallback;
    private TwaServiceConnection twaConnection;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.main);

        Button btnSiteA = findViewById(R.id.ai);
        Button btnSiteB = findViewById(R.id.twa_127);
        Button btnGetData = findViewById(R.id.network_info);

        messageCallback = new TwaMessageBridgeCallback(new MessageDispatcher(), new WebServerWithSocket(this, 8080));
        twaConnection = new TwaServiceConnection(messageCallback);
        twaConnection.bind(this);

        btnSiteA.setOnClickListener(v -> launchTwa("https://site-a.com"));
        btnSiteB.setOnClickListener(v -> launchTwa("https://site-b.com"));

    }

    private void launchTwa(String url) {
        CustomTabsSession session = twaConnection.getSession();
        if (session == null) {
            Toast.makeText(this, "TWA сервис еще загружается, подождите...", Toast.LENGTH_SHORT).show();
            return;
        }

        // Запускаем TWA
        Uri launchUri = Uri.parse(url);
        TrustedWebActivityIntentBuilder builder = new TrustedWebActivityIntentBuilder(launchUri);
        TrustedWebActivityIntent twaIntent = builder.build(session);
        twaIntent.launchTrustedWebActivity(this);
    }

    @Override
    protected void onDestroy() {
        // Полная очистка ресурсов при выходе из приложения
        messageCallback.clear();
        twaConnection.unbind(this);
        super.onDestroy();
    }
}

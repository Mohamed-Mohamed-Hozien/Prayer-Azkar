package com.prayertimes.athkar;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Expose Native Android Widget Bridge to WebView JavaScript
        try {
            WebView webView = this.getBridge().getWebView();
            webView.addJavascriptInterface(new AndroidWidgetBridge(this), "AndroidWidgetBridge");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * Intercept hardware volume keys to immediately stop active Azan playback
     */
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_VOLUME_DOWN || keyCode == KeyEvent.KEYCODE_VOLUME_UP) {
            try {
                WebView webView = this.getBridge().getWebView();
                if (webView != null) {
                    webView.evaluateJavascript(
                        "if (typeof window.__stopAzanFromHardware === 'function') { window.__stopAzanFromHardware(); }",
                        null
                    );
                }
            } catch (Exception ignored) {}
        }
        return super.onKeyDown(keyCode, event);
    }

    public static class AndroidWidgetBridge {
        private final Context context;

        public AndroidWidgetBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void updateWidgetData(String jsonString) {
            try {
                SharedPreferences prefs = context.getSharedPreferences("prayer_widget_prefs", Context.MODE_PRIVATE);
                prefs.edit().putString("data", jsonString).apply();
                PrayerWidgetProvider.updateAllWidgets(context);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}

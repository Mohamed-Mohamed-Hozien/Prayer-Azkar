package com.prayertimes.athkar;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
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

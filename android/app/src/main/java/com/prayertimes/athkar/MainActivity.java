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

        // Expose Native Android Widget & Prayer Alarm Bridges to WebView JavaScript
        try {
            WebView webView = this.getBridge().getWebView();
            AndroidBridge bridge = new AndroidBridge(this);
            webView.addJavascriptInterface(bridge, "AndroidWidgetBridge");
            webView.addJavascriptInterface(bridge, "AndroidPrayerAlarmBridge");
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
            if (PrayerAudioService.isPlaying) {
                PrayerAudioService.stop(this);
            }
            try {
                WebView webView = this.getBridge().getWebView();
                if (webView != null) {
                    webView.evaluateJavascript(
                        "if (typeof window.__stopAzanFromHardware === 'function') { window.__stopAzanFromHardware(); }",
                        null
                    );
                }
            } catch (Exception ignored) {}
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    public static class AndroidBridge {
        private final Context context;

        public AndroidBridge(Context context) {
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

        @JavascriptInterface
        public void schedulePrayerAlarms(String alarmsJson) {
            try {
                PrayerAlarmScheduler.scheduleAlarms(context, alarmsJson);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @JavascriptInterface
        public void stopAzan() {
            try {
                PrayerAudioService.stop(context);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @JavascriptInterface
        public boolean isAzanPlaying() {
            return PrayerAudioService.isPlaying;
        }

        @JavascriptInterface
        public String getCurrentPlayingPrayer() {
            return PrayerAudioService.currentPrayerNameAr != null ? PrayerAudioService.currentPrayerNameAr : "";
        }
    }
}

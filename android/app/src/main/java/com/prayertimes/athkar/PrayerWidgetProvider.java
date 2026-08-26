package com.prayertimes.athkar;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import org.json.JSONObject;

/**
 * Dynamic Native Android Home Screen & Lock Screen AppWidget Provider
 */
public class PrayerWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAllWidgets(Context context) {
        try {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName thisWidget = new ComponentName(context, PrayerWidgetProvider.class);
            int[] allWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);
            for (int widgetId : allWidgetIds) {
                updateAppWidget(context, appWidgetManager, widgetId);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.prayer_widget_4x2);

        // Click on widget opens MainActivity
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        // Read dynamic data from SharedPreferences
        try {
            SharedPreferences prefs = context.getSharedPreferences("prayer_widget_prefs", Context.MODE_PRIVATE);
            String rawJson = prefs.getString("data", null);

            if (rawJson != null) {
                JSONObject json = new JSONObject(rawJson);
                if (json.has("fajr")) views.setTextViewText(R.id.tv_fajr_time, json.getString("fajr"));
                if (json.has("dhuhr")) views.setTextViewText(R.id.tv_dhuhr_time, json.getString("dhuhr"));
                if (json.has("asr")) views.setTextViewText(R.id.tv_asr_time, json.getString("asr"));
                if (json.has("maghrib")) views.setTextViewText(R.id.tv_maghrib_time, json.getString("maghrib"));
                if (json.has("isha")) views.setTextViewText(R.id.tv_isha_time, json.getString("isha"));
                if (json.has("nextPrayer")) views.setTextViewText(R.id.widget_next_prayer, json.getString("nextPrayer"));
                if (json.has("title")) views.setTextViewText(R.id.widget_title, json.getString("title"));
                if (json.has("footer")) views.setTextViewText(R.id.widget_footer, json.getString("footer"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}

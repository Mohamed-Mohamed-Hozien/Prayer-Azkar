package com.prayertimes.athkar;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;
import org.json.JSONArray;
import org.json.JSONObject;

public class PrayerAlarmScheduler {
    private static final String TAG = "PrayerAlarmScheduler";
    public static final String PREFS_NAME = "prayer_alarm_prefs";
    public static final String KEY_SAVED_ALARMS = "saved_alarms_json";

    public static void scheduleAlarms(Context context, String alarmsJsonString) {
        if (context == null || alarmsJsonString == null) return;

        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putString(KEY_SAVED_ALARMS, alarmsJsonString).apply();

            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            JSONArray alarmsArray = new JSONArray(alarmsJsonString);
            long now = System.currentTimeMillis();

            for (int i = 0; i < alarmsArray.length(); i++) {
                JSONObject alarmObj = alarmsArray.getJSONObject(i);
                int requestCode = alarmObj.optInt("requestCode", 1000 + i);
                long timestamp = alarmObj.optLong("timestamp", 0);
                String prayerId = alarmObj.optString("prayerId", "");
                String prayerNameAr = alarmObj.optString("prayerNameAr", "");
                String sound = alarmObj.optString("sound", "azan_makkah");
                String alertMode = alarmObj.optString("alertMode", "full");

                if (timestamp <= now) {
                    continue; // Skip past times
                }

                Intent intent = new Intent(context, PrayerAlarmReceiver.class);
                intent.setAction("com.prayertimes.athkar.ACTION_PRAYER_ALARM");
                intent.putExtra("requestCode", requestCode);
                intent.putExtra("prayerId", prayerId);
                intent.putExtra("prayerNameAr", prayerNameAr);
                intent.putExtra("sound", sound);
                intent.putExtra("alertMode", alertMode);

                PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    context,
                    requestCode,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    Intent showIntent = new Intent(context, MainActivity.class);
                    PendingIntent showPendingIntent = PendingIntent.getActivity(
                        context,
                        requestCode,
                        showIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                    );
                    AlarmManager.AlarmClockInfo clockInfo = new AlarmManager.AlarmClockInfo(timestamp, showPendingIntent);
                    alarmManager.setAlarmClock(clockInfo, pendingIntent);
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, timestamp, pendingIntent);
                } else {
                    alarmManager.setExact(AlarmManager.RTC_WAKEUP, timestamp, pendingIntent);
                }

                Log.d(TAG, "Scheduled exact alarm for " + prayerNameAr + " (" + prayerId + ") at " + timestamp);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to schedule alarms", e);
        }
    }

    public static void rescheduleAll(Context context) {
        if (context == null) return;
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String savedAlarms = prefs.getString(KEY_SAVED_ALARMS, null);
            if (savedAlarms != null && !savedAlarms.isEmpty()) {
                Log.d(TAG, "Rescheduling alarms on boot/restore");
                scheduleAlarms(context, savedAlarms);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to reschedule on boot", e);
        }
    }

    public static void cancelAlarm(Context context, int requestCode) {
        try {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager != null) {
                Intent intent = new Intent(context, PrayerAlarmReceiver.class);
                intent.setAction("com.prayertimes.athkar.ACTION_PRAYER_ALARM");
                PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    context,
                    requestCode,
                    intent,
                    PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
                );
                if (pendingIntent != null) {
                    alarmManager.cancel(pendingIntent);
                    pendingIntent.cancel();
                }
            }
        } catch (Exception ignored) {}
    }
}

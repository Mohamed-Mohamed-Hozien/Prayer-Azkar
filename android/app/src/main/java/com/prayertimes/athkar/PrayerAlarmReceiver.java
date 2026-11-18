package com.prayertimes.athkar;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import androidx.core.content.ContextCompat;

public class PrayerAlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "PrayerAlarmReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String prayerId = intent.getStringExtra("prayerId");
        String prayerNameAr = intent.getStringExtra("prayerNameAr");
        String sound = intent.getStringExtra("sound");
        String alertMode = intent.getStringExtra("alertMode");

        Log.d(TAG, "Alarm triggered for: " + prayerNameAr + " (" + prayerId + "), mode: " + alertMode);

        if ("silent".equals(alertMode)) {
            Log.d(TAG, "Silent mode - skipping audio alert");
            return;
        }

        Intent serviceIntent = new Intent(context, PrayerAudioService.class);
        serviceIntent.setAction(PrayerAudioService.ACTION_START_AZAN);
        serviceIntent.putExtra("prayerId", prayerId);
        serviceIntent.putExtra("prayerNameAr", prayerNameAr);
        serviceIntent.putExtra("sound", sound);
        serviceIntent.putExtra("alertMode", alertMode);

        try {
            ContextCompat.startForegroundService(context, serviceIntent);
        } catch (Exception e) {
            Log.e(TAG, "Failed to start PrayerAudioService", e);
        }
    }
}

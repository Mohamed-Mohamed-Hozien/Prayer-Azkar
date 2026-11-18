package com.prayertimes.athkar;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class PrayerBootReceiver extends BroadcastReceiver {
    private static final String TAG = "PrayerBootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent != null ? intent.getAction() : null;
        Log.d(TAG, "Received broadcast action: " + action);
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) ||
            Intent.ACTION_MY_PACKAGE_REPLACED.equals(action) ||
            "android.intent.action.QUICKBOOT_POWERON".equals(action)) {
            PrayerAlarmScheduler.rescheduleAll(context);
        }
    }
}

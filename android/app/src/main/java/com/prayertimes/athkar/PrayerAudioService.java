package com.prayertimes.athkar;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class PrayerAudioService extends Service {
    private static final String TAG = "PrayerAudioService";
    public static final String CHANNEL_ID = "prayer_azan_playback_channel";
    public static final int NOTIFICATION_ID = 3001;

    public static final String ACTION_START_AZAN = "com.prayertimes.athkar.START_AZAN";
    public static final String ACTION_STOP_AZAN = "com.prayertimes.athkar.STOP_AZAN";

    public static volatile boolean isPlaying = false;
    public static volatile String currentPrayerId = null;
    public static volatile String currentPrayerNameAr = null;

    private MediaPlayer mediaPlayer;
    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "أذان الصلوات وتنبيهات الإقامة",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("تشغيل صوت الأذان في موعد كل صلاة بدقة حتى عند قفل الشاشة أو إغلاق التطبيق");
                channel.enableVibration(true);
                channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                channel.setSound(null, null); // Handled directly via MediaPlayer with USAGE_ALARM
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;

        if (ACTION_STOP_AZAN.equals(action)) {
            Log.d(TAG, "Stop Azan action received");
            stopAzanPlayback();
            stopSelf();
            return START_NOT_STICKY;
        }

        String prayerId = intent != null ? intent.getStringExtra("prayerId") : "fajr";
        String prayerNameAr = intent != null ? intent.getStringExtra("prayerNameAr") : "الصلاة";
        String sound = intent != null ? intent.getStringExtra("sound") : "azan_makkah";
        String alertMode = intent != null ? intent.getStringExtra("alertMode") : "full";

        startAzanPlayback(prayerId, prayerNameAr, sound, alertMode);
        return START_NOT_STICKY;
    }

    private void startAzanPlayback(String prayerId, String prayerNameAr, String sound, String alertMode) {
        stopAzanPlayback(); // stop any prior session cleanly

        currentPrayerId = prayerId;
        currentPrayerNameAr = prayerNameAr;
        isPlaying = true;

        // 1. Acquire partial wake lock for up to 6 minutes (typical Azan is 2-4 mins)
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "PrayerTimes::AzanWakeLock");
                wakeLock.acquire(6 * 60 * 1000L);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to acquire wake lock", e);
        }

        // 2. Resolve sound resource ID
        int soundResId = resolveSoundResource(sound, alertMode, prayerId);

        // 3. Build ongoing notification with Stop action
        Intent stopIntent = new Intent(this, PrayerAudioService.class);
        stopIntent.setAction(ACTION_STOP_AZAN);
        PendingIntent stopPendingIntent = PendingIntent.getService(
            this,
            2,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent openAppIntent = new Intent(this, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        openAppIntent.putExtra("from_azan", true);
        openAppIntent.putExtra("prayer_id", prayerId);
        PendingIntent openPendingIntent = PendingIntent.getActivity(
            this,
            1,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("حان الآن موعد أذان " + prayerNameAr)
            .setContentText("الله أكبر، حي على الصلاة • اضغط للإيقاف")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setContentIntent(openPendingIntent)
            .addAction(android.R.drawable.ic_media_pause, "إيقاف الأذان", stopPendingIntent);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            builder.setFullScreenIntent(openPendingIntent, true);
        }

        Notification notification = builder.build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        // 4. Initialize MediaPlayer with AudioAttributes.USAGE_ALARM
        try {
            mediaPlayer = MediaPlayer.create(this, soundResId);
            if (mediaPlayer != null) {
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
                mediaPlayer.setAudioAttributes(audioAttributes);
                mediaPlayer.setLooping(false);
                mediaPlayer.setOnCompletionListener(mp -> {
                    Log.d(TAG, "Azan playback completed naturally");
                    stopAzanPlayback();
                    stopSelf();
                });
                mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                    Log.e(TAG, "MediaPlayer error: " + what + ", extra: " + extra);
                    stopAzanPlayback();
                    stopSelf();
                    return true;
                });
                mediaPlayer.start();
                Log.d(TAG, "Azan started successfully with soundResId: " + soundResId);
            } else {
                Log.e(TAG, "MediaPlayer.create returned null for sound: " + sound);
                stopAzanPlayback();
                stopSelf();
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to start MediaPlayer", e);
            stopAzanPlayback();
            stopSelf();
        }
    }

    private int resolveSoundResource(String sound, String alertMode, String prayerId) {
        if ("takbeer".equals(alertMode)) {
            return R.raw.takbeer;
        }
        if ("beep".equals(alertMode)) {
            return R.raw.iqamah_beep;
        }

        String rawName = sound != null ? sound.toLowerCase().replace('-', '_') : "azan_makkah";
        if ("fajr".equals(prayerId) && ("azan_fajr".equals(rawName) || "fajr".equals(rawName))) {
            rawName = "azan_fajr";
        }

        int resId = getResources().getIdentifier(rawName, "raw", getPackageName());
        if (resId == 0) {
            resId = R.raw.azan_makkah;
        }
        return resId;
    }

    private void stopAzanPlayback() {
        isPlaying = false;
        currentPrayerId = null;
        currentPrayerNameAr = null;

        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.reset();
                mediaPlayer.release();
            } catch (Exception ignored) {}
            mediaPlayer = null;
        }

        if (wakeLock != null && wakeLock.isHeld()) {
            try {
                wakeLock.release();
            } catch (Exception ignored) {}
            wakeLock = null;
        }

        try {
            stopForeground(true);
        } catch (Exception ignored) {}
    }

    public static void stop(Context context) {
        if (context == null) return;
        try {
            Intent intent = new Intent(context, PrayerAudioService.class);
            intent.setAction(ACTION_STOP_AZAN);
            context.startService(intent);
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop service", e);
        }
        isPlaying = false;
    }

    @Override
    public void onDestroy() {
        stopAzanPlayback();
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}

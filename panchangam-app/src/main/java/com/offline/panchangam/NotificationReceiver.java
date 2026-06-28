package com.offline.panchangam;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import java.util.Calendar;

public class NotificationReceiver extends BroadcastReceiver {

    static final String CHANNEL_ID    = "panchangam_daily";
    static final String PREFS_NAME    = "PanchangamPrefs";
    static final String PREF_CITY     = "cityIndex";
    static final String PREF_NOTIF_ON = "notifEnabled";
    static final String PREF_NOTIF_H  = "notifHour";
    static final String PREF_NOTIF_M  = "notifMinute";
    static final int    NOTIF_ID      = 1001;
    static final int    REQUEST_CODE  = 2001;

    @Override
    public void onReceive(Context ctx, Intent intent) {
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        if (!prefs.getBoolean(PREF_NOTIF_ON, true)) return;

        int cityIndex = prefs.getInt(PREF_CITY, 0);
        String text   = PanchangamCompute.buildNotificationText(cityIndex);
        String city   = PanchangamCompute.CITY_NAMES[cityIndex];

        createChannel(ctx);

        Intent openApp = new Intent(ctx, MainActivity.class);
        openApp.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pi = PendingIntent.getActivity(ctx, 0, openApp, piFlags);

        Notification notif = buildNotification(ctx, city, text, pi);

        NotificationManager nm =
            (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.notify(NOTIF_ID, notif);

        scheduleNext(ctx);
    }

    @SuppressWarnings("deprecation")
    private static Notification buildNotification(Context ctx, String city, String text,
                                                  PendingIntent pi) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            return new Notification.Builder(ctx, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("Panchangam · " + city)
                .setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setContentIntent(pi)
                .setAutoCancel(true)
                .build();
        } else {
            return new Notification.Builder(ctx)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("Panchangam · " + city)
                .setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setContentIntent(pi)
                .setAutoCancel(true)
                .setPriority(Notification.PRIORITY_DEFAULT)
                .build();
        }
    }

    static void createChannel(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm =
            (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null || nm.getNotificationChannel(CHANNEL_ID) != null) return;
        NotificationChannel ch = new NotificationChannel(
            CHANNEL_ID,
            ctx.getString(R.string.notif_channel_name),
            NotificationManager.IMPORTANCE_DEFAULT
        );
        ch.setDescription(ctx.getString(R.string.notif_channel_desc));
        nm.createNotificationChannel(ch);
    }

    static void schedule(Context ctx) {
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        if (!prefs.getBoolean(PREF_NOTIF_ON, true)) {
            cancel(ctx);
            return;
        }
        int hour   = prefs.getInt(PREF_NOTIF_H, 7);
        int minute = prefs.getInt(PREF_NOTIF_M, 0);
        setAlarm(ctx, hour, minute);
    }

    private static void scheduleNext(Context ctx) {
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        setAlarm(ctx, prefs.getInt(PREF_NOTIF_H, 7), prefs.getInt(PREF_NOTIF_M, 0));
    }

    private static void setAlarm(Context ctx, int hour, int minute) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, hour);
        cal.set(Calendar.MINUTE, minute);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        if (cal.getTimeInMillis() <= System.currentTimeMillis()) {
            cal.add(Calendar.DAY_OF_YEAR, 1);
        }

        PendingIntent pi = buildPendingIntent(ctx);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), pi);
            } else {
                am.setExact(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), pi);
            }
        } catch (SecurityException e) {
            // Exact alarm permission not granted; use inexact fallback.
            am.set(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), pi);
        }
    }

    static void cancel(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(buildPendingIntent(ctx));
    }

    private static PendingIntent buildPendingIntent(Context ctx) {
        Intent intent = new Intent(ctx, NotificationReceiver.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(ctx, REQUEST_CODE, intent, flags);
    }
}

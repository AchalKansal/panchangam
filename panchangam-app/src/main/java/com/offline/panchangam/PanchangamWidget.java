package com.offline.panchangam;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.widget.RemoteViews;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

public class PanchangamWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            updateWidget(context, appWidgetManager, id);
        }
    }

    static void updateWidget(Context context, AppWidgetManager mgr, int appWidgetId) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(
                NotificationReceiver.PREFS_NAME, Context.MODE_PRIVATE);
            int cityIdx = prefs.getInt(NotificationReceiver.PREF_CITY, 0);
            if (cityIdx < 0 || cityIdx >= PanchangamCompute.CITY_NAMES.length) cityIdx = 0;

            Calendar cal = Calendar.getInstance();
            int y  = cal.get(Calendar.YEAR);
            int mo = cal.get(Calendar.MONTH) + 1;
            int dy = cal.get(Calendar.DAY_OF_MONTH);
            int wd = cal.get(Calendar.DAY_OF_WEEK) - 1; // 0=Sun

            long nowMs = cal.getTimeInMillis();
            double utcH = cal.get(Calendar.HOUR_OF_DAY)
                        + cal.get(Calendar.MINUTE) / 60.0
                        + cal.get(Calendar.SECOND) / 3600.0;
            int tzOffsetMs = cal.getTimeZone().getOffset(nowMs);
            double utcActual = utcH - tzOffsetMs / 3600000.0;

            double J  = PanchangamCompute.jd(y, mo, dy, utcActual);
            double sL = PanchangamCompute.sunLon(J);
            double mL = PanchangamCompute.moonLon(J);
            double ay = PanchangamCompute.ayanamsa(J);

            int tIdx = PanchangamCompute.tithi(sL, mL);
            int nIdx = PanchangamCompute.nakshatra(mL, ay);
            String paksha = tIdx <= 15 ? "Shukla" : "Krishna";
            int tNum = tIdx <= 15 ? tIdx : tIdx - 15;

            // Rahu Kaal
            String rahuStr = "–";
            double lat = PanchangamCompute.CITY_LAT[cityIdx];
            double lon = PanchangamCompute.CITY_LON[cityIdx];
            double[] ss = PanchangamCompute.sunriseSunset(y, mo, dy, lat, lon);
            if (ss != null) {
                double srH  = ss[0] + PanchangamCompute.IST;
                double stH  = ss[1] + PanchangamCompute.IST;
                double part = (stH - srH) / 8.0;
                int    rp   = PanchangamCompute.RAHU_PERIOD[wd];
                double rS   = srH + (rp - 1) * part;
                double rE   = srH +  rp      * part;
                rahuStr = PanchangamCompute.fmtLocalHour(rS) + " – " + PanchangamCompute.fmtLocalHour(rE);
            }

            String dateStr  = new SimpleDateFormat("EEE, d MMM", Locale.getDefault()).format(cal.getTime());
            String tithiStr = paksha + " " + tNum + " · " + PanchangamCompute.TITHIS[tIdx - 1];
            String nkshStr  = PanchangamCompute.NAKSHATRAS[nIdx];
            String cityStr  = PanchangamCompute.CITY_NAMES[cityIdx];

            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_panchangam);
            views.setTextViewText(R.id.widgetDate,      dateStr);
            views.setTextViewText(R.id.widgetCity,      cityStr);
            views.setTextViewText(R.id.widgetTithi,     tithiStr);
            views.setTextViewText(R.id.widgetNakshatra, nkshStr);
            views.setTextViewText(R.id.widgetRahu,      rahuStr);

            // Tap widget to open app
            Intent intent = new Intent(context, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            int piFlags = PendingIntent.FLAG_UPDATE_CURRENT
                | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
            PendingIntent pi = PendingIntent.getActivity(context, 0, intent, piFlags);
            views.setOnClickPendingIntent(R.id.widgetRoot, pi);

            mgr.updateAppWidget(appWidgetId, views);
        } catch (Exception e) {
            // Widget update must never crash the system
        }
    }
}

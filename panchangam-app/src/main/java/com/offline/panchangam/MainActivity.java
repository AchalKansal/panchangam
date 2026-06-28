package com.offline.panchangam;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Base64;
import android.view.View;
import androidx.core.view.WindowCompat;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.FileOutputStream;

public class MainActivity extends Activity {

    private static final int REQ_NOTIF_PERMISSION = 100;

    private WebView webView;
    private int topInset    = 0;
    private int bottomInset = 0;
    private boolean pageLoaded = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);

        webView = new WebView(this);
        webView.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        );
        setContentView(webView);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.addJavascriptInterface(new AndroidBridge(), "Android");

        webView.setOnApplyWindowInsetsListener((v, insets) -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                topInset    = bars.top;
                bottomInset = bars.bottom;
            } else {
                topInset    = insets.getSystemWindowInsetTop();
                bottomInset = insets.getSystemWindowInsetBottom();
            }
            pushInsetsToPage();
            return insets;
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                pageLoaded = true;
                view.postDelayed(() -> {
                    pushInsetsToPage();
                    pushSavedSettingsToPage();
                }, 80);
            }
        });

        webView.requestApplyInsets();
        webView.loadUrl("file:///android_asset/index.html");

        // Set up notification channel and schedule daily alarm.
        try {
            NotificationReceiver.createChannel(this);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                        != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(
                        new String[]{Manifest.permission.POST_NOTIFICATIONS},
                        REQ_NOTIF_PERMISSION
                    );
                } else {
                    NotificationReceiver.schedule(this);
                }
            } else {
                NotificationReceiver.schedule(this);
            }
        } catch (Exception e) {
            // Notification setup must never crash the app.
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode == REQ_NOTIF_PERMISSION) {
            // Schedule regardless — if denied the notification simply won't show.
            NotificationReceiver.schedule(this);
        }
    }

    private void pushInsetsToPage() {
        if (!pageLoaded) return;
        String js = "typeof applyInsets==='function'&&applyInsets(" + topInset + "," + bottomInset + ")";
        runOnUiThread(() -> webView.evaluateJavascript(js, null));
    }

    // Push any previously-saved native settings into the JS layer so the UI reflects them.
    private void pushSavedSettingsToPage() {
        SharedPreferences prefs = getSharedPreferences(NotificationReceiver.PREFS_NAME, MODE_PRIVATE);
        boolean notifOn = prefs.getBoolean(NotificationReceiver.PREF_NOTIF_ON, true);
        int notifH      = prefs.getInt(NotificationReceiver.PREF_NOTIF_H, 7);
        String js = "typeof applyNativeSettings==='function'&&applyNativeSettings("
                  + (notifOn ? "true" : "false") + "," + notifH + ")";
        runOnUiThread(() -> webView.evaluateJavascript(js, null));
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    private class AndroidBridge {

        @JavascriptInterface
        public void vibrate(int durationMs) {
            Vibrator v = (Vibrator) getSystemService(VIBRATOR_SERVICE);
            if (v == null || !v.hasVibrator()) return;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                v.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE));
            } else {
                v.vibrate(durationMs);
            }
        }

        // Called by JS when settings change — persists to SharedPreferences and reschedules alarm.
        @JavascriptInterface
        public void saveNativeSettings(int cityIndex, boolean notifEnabled, int notifHour) {
            SharedPreferences.Editor ed = getSharedPreferences(
                NotificationReceiver.PREFS_NAME, MODE_PRIVATE).edit();
            ed.putInt(NotificationReceiver.PREF_CITY, cityIndex);
            ed.putBoolean(NotificationReceiver.PREF_NOTIF_ON, notifEnabled);
            ed.putInt(NotificationReceiver.PREF_NOTIF_H, notifHour);
            ed.putInt(NotificationReceiver.PREF_NOTIF_M, 0);
            ed.apply();
            NotificationReceiver.schedule(MainActivity.this);
        }

        // Shares the panchanga as a JPEG image generated from canvas on the JS side.
        @JavascriptInterface
        public void shareImage(String base64Jpeg) {
            try {
                byte[] bytes = Base64.decode(base64Jpeg, Base64.DEFAULT);
                File cacheDir = getExternalCacheDir();
                if (cacheDir == null) cacheDir = getCacheDir();
                File imgFile = new File(cacheDir, "panchangam_share.jpg");
                try (FileOutputStream fos = new FileOutputStream(imgFile)) {
                    fos.write(bytes);
                }
                Uri uri = FileProvider.getUriForFile(
                    MainActivity.this,
                    getPackageName() + ".fileprovider",
                    imgFile
                );
                Intent shareIntent = new Intent(Intent.ACTION_SEND);
                shareIntent.setType("image/jpeg");
                shareIntent.putExtra(Intent.EXTRA_STREAM, uri);
                shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                Intent chooser = Intent.createChooser(shareIntent, "Share via");
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(chooser);
            } catch (Exception e) {
                // Ignore — share fails silently if something goes wrong.
            }
        }
    }
}

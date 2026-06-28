package com.offline.panchangam;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

// Re-schedules the daily notification alarm after a device reboot.
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        String action = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(action)
                || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            NotificationReceiver.createChannel(ctx);
            NotificationReceiver.schedule(ctx);
        }
    }
}

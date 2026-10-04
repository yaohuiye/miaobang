package io.miaobang.reminder

import android.app.Activity
import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import android.os.SystemClock
import android.provider.Settings
import org.json.JSONObject
import java.util.UUID

object ReminderNative {
    private const val STORE = "miaobang-reminder-probe"
    private const val ACTIVE = "active"
    private const val CHANNEL = "miaobang-focus-v1"
    private const val REQUEST = 701

    private fun alarms(c: Context) = c.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    private fun notifications(c: Context) = c.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    private fun prefs(c: Context) = c.getSharedPreferences(STORE, Context.MODE_PRIVATE)
    private fun boot(c: Context) = Settings.Global.getInt(c.contentResolver, Settings.Global.BOOT_COUNT, -1)
    private fun read(c: Context) = JSONObject(prefs(c).getString(ACTIVE, "{}") ?: "{}")
    private fun save(c: Context, value: JSONObject) {
        check(prefs(c).edit().putString(ACTIVE, value.toString()).commit()) { "本地保存失败，请重试" }
    }

    private fun ensureChannel(c: Context) {
        if (notifications(c).getNotificationChannel(CHANNEL) != null) return
        val channel = NotificationChannel(CHANNEL, "专注到点提醒", NotificationManager.IMPORTANCE_DEFAULT)
        channel.description = "专注结束时发出一次提示"
        channel.enableVibration(true)
        channel.setSound(Settings.System.DEFAULT_NOTIFICATION_URI,
            AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).build())
        notifications(c).createNotificationChannel(channel)
    }

    private fun notificationAllowed(c: Context): Boolean {
        val granted = Build.VERSION.SDK_INT < 33 || c.checkSelfPermission("android.permission.POST_NOTIFICATIONS") == PackageManager.PERMISSION_GRANTED
        return granted && notifications(c).areNotificationsEnabled() &&
            notifications(c).getNotificationChannel(CHANNEL)?.importance != NotificationManager.IMPORTANCE_NONE
    }

    private fun exactAllowed(c: Context) = Build.VERSION.SDK_INT < 31 || alarms(c).canScheduleExactAlarms()

    private fun pending(c: Context, id: String = "", create: Boolean = true): PendingIntent? {
        val intent = Intent(c, ReminderReceiver::class.java).setAction("io.miaobang.reminder.DUE").putExtra("id", id)
        val mode = if (create) PendingIntent.FLAG_UPDATE_CURRENT else PendingIntent.FLAG_NO_CREATE
        return PendingIntent.getBroadcast(c, REQUEST, intent, mode or PendingIntent.FLAG_IMMUTABLE)
    }

    private fun stopAlarm(c: Context) {
        pending(c, create = false)?.let { alarms(c).cancel(it); it.cancel() }
    }

    @Synchronized
    fun snapshot(c: Context): String {
        ensureChannel(c)
        val active = read(c)
        if (active.optString("phase") == "scheduled") {
            if (active.optInt("boot", -1) != boot(c)) {
                stopAlarm(c)
                active.put("phase", "interrupted")
                save(c, active)
            } else if (SystemClock.elapsedRealtime() >= active.optLong("dueMs")) {
                active.put("phase", "elapsed")
                save(c, active)
            }
        }
        val remaining = if (active.optString("phase") == "scheduled")
            ((active.optLong("dueMs") - SystemClock.elapsedRealtime()).coerceAtLeast(0L) + 999) / 1000 else 0
        return JSONObject().put("supported", true).put("androidVersion", Build.VERSION.RELEASE)
            .put("device", "${Build.MANUFACTURER} ${Build.MODEL}")
            .put("notificationAllowed", notificationAllowed(c)).put("exactAllowed", exactAllowed(c))
            .put("channelSound", notifications(c).getNotificationChannel(CHANNEL)?.sound != null)
            .put("clock", JSONObject().put("boot", boot(c).toString())
                .put("monoMs", SystemClock.elapsedRealtime()).put("wallMs", System.currentTimeMillis()))
            .put("remainingSeconds", remaining).put("active", active).toString()
    }

    @Synchronized
    fun schedule(c: Context, seconds: Number, ownerId: String): String {
        val duration = seconds.toDouble()
        require(duration.isFinite() && duration >= 1 && duration <= 7200 && duration % 1 == 0.0) { "提醒时长必须为 1–7200 秒的整数" }
        ensureChannel(c)
        check(notificationAllowed(c)) { "请先允许通知，并开启专注提醒渠道" }
        check(exactAllowed(c)) { "请先允许闹钟和提醒" }
        val previous = read(c)
        val previousOwner = previous.optString("ownerId", "probe")
        check(previous.optString("phase") !in listOf("scheduled", "elapsed") || previousOwner == "probe" || previousOwner == ownerId) {
            "还有一轮专注提醒未结束，请先回到专注页面收尾"
        }
        cancel(c)
        val id = UUID.randomUUID().toString()
        val now = SystemClock.elapsedRealtime()
        val active = JSONObject().put("id", id).put("ownerId", ownerId).put("phase", "scheduled")
            .put("startMs", now).put("dueMs", now + duration.toLong() * 1000)
            .put("boot", boot(c)).put("createdAt", System.currentTimeMillis()).put("notificationPosted", false)
        save(c, active)
        try {
            alarms(c).setExactAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP,
                active.getLong("dueMs"), pending(c, id)!!)
        } catch (error: Exception) {
            stopAlarm(c)
            active.put("phase", "failed")
            save(c, active)
            throw error
        }
        return snapshot(c)
    }

    @Synchronized
    fun cancelOwned(c: Context, ownerId: String): String {
        if (read(c).optString("ownerId", "probe") != ownerId) return snapshot(c)
        return cancel(c)
    }

    @Synchronized
    fun cancel(c: Context): String {
        stopAlarm(c)
        notifications(c).cancel(REQUEST)
        val active = read(c)
        if (active.length() > 0) {
            active.put("phase", "cancelled")
            save(c, active)
        }
        return snapshot(c)
    }

    fun requestPermission(activity: Activity, kind: String) {
        activity.runOnUiThread {
            when (kind) {
                "notification" -> {
                    if (Build.VERSION.SDK_INT >= 33 && activity.checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
                        activity.requestPermissions(arrayOf("android.permission.POST_NOTIFICATIONS"), REQUEST)
                    } else {
                        activity.startActivity(Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                            .putExtra(Settings.EXTRA_APP_PACKAGE, activity.packageName))
                    }
                }
                "exact" -> if (Build.VERSION.SDK_INT >= 31) {
                    activity.startActivity(Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                        Uri.parse("package:" + activity.packageName)))
                }
                else -> throw IllegalArgumentException("未知的权限类型")
            }
        }
    }

    @Synchronized
    fun deliver(c: Context, intent: Intent) {
        val active = read(c)
        if (intent.getStringExtra("id") != active.optString("id") ||
            active.optString("phase") !in listOf("scheduled", "elapsed") || active.optInt("boot", -1) != boot(c)) return
        if (SystemClock.elapsedRealtime() < active.optLong("dueMs")) return
        ensureChannel(c)
        active.put("phase", "elapsed")
        if (active.optBoolean("notificationPosted")) return
        if (!notificationAllowed(c)) {
            active.put("notificationError", "通知权限或渠道已关闭")
            save(c, active)
            return
        }
        val launch = c.packageManager.getLaunchIntentForPackage(c.packageName)
        val builder = Notification.Builder(c, CHANNEL)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle("妙帮 · 到时间了")
            .setContentText(if (active.optString("ownerId", "probe") == "probe") "提醒验证完成，可以回到妙帮查看结果。"
                else "这一轮计时结束了，和家长一起确认小任务的结果吧。")
            .setAutoCancel(true).setOnlyAlertOnce(true)
        if (launch != null) {
            launch.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            builder.setContentIntent(PendingIntent.getActivity(c, REQUEST, launch,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))
        }
        try {
            notifications(c).notify(REQUEST, builder.build())
            active.put("notificationPosted", true).put("postedAt", System.currentTimeMillis())
        } catch (error: SecurityException) {
            active.put("notificationError", "通知权限已变化")
        }
        save(c, active)
    }
}

class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        ReminderNative.deliver(context, intent)
    }
}

package com.mobiledeviceinfo.deviceinfo

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiManager
import android.os.BatteryManager
import android.os.Build
import android.os.StatFs
import android.provider.Settings
import com.facebook.fbreact.specs.NativeMobileDeviceInfoSpec
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import java.net.InetAddress

class DeviceInfoModule(reactContext: ReactApplicationContext) :
    NativeMobileDeviceInfoSpec(reactContext) {

  override fun getName() = NAME

  override fun getDeviceInfo(promise: Promise) {
    try {
      val result = Arguments.createMap()
      result.putMap("hardware", getHardwareInfo())
      result.putMap("battery", getBatteryInfo())
      result.putMap("storage", getStorageInfo())
      result.putMap("network", getNetworkInfo())
      result.putMap("app", getAppInfo())
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("DEVICE_INFO_ERROR", e)
    }
  }

  private fun getHardwareInfo(): WritableMap {
    val map = Arguments.createMap()
    val metrics = reactApplicationContext.resources.displayMetrics
    map.putString("model", Build.MODEL)
    map.putString("manufacturer", Build.MANUFACTURER)
    map.putString("osName", "Android")
    map.putString("osVersion", Build.VERSION.RELEASE)
    map.putInt("screenWidth", metrics.widthPixels)
    map.putInt("screenHeight", metrics.heightPixels)
    map.putDouble("screenDensity", metrics.density.toDouble())
    return map
  }

  private fun getBatteryInfo(): WritableMap {
    val map = Arguments.createMap()
    val intent = reactApplicationContext.registerReceiver(
      null, IntentFilter(Intent.ACTION_BATTERY_CHANGED)
    )
    val level = intent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
    val scale = intent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
    val status = intent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
    map.putDouble("level", if (level >= 0 && scale > 0) level / scale.toDouble() else -1.0)
    map.putBoolean(
      "isCharging",
      status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL
    )
    return map
  }

  private fun getStorageInfo(): WritableMap {
    val map = Arguments.createMap()
    val stat = StatFs(reactApplicationContext.filesDir.path)
    val total = stat.blockCountLong * stat.blockSizeLong
    val free = stat.availableBlocksLong * stat.blockSizeLong
    map.putDouble("totalStorage", total.toDouble())
    map.putDouble("freeStorage", free.toDouble())
    return map
  }

  private fun getNetworkInfo(): WritableMap {
    val map = Arguments.createMap()
    val cm = reactApplicationContext.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    val network = cm.activeNetwork
    val caps = network?.let { cm.getNetworkCapabilities(it) }
    val type = when {
      caps == null -> "none"
      caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "wifi"
      caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "cellular"
      else -> "unknown"
    }
    map.putString("connectionType", type)

    val wifiManager = reactApplicationContext.applicationContext
      .getSystemService(Context.WIFI_SERVICE) as WifiManager
    val ip = try {
      val ipInt = wifiManager.connectionInfo.ipAddress
      String.format(
        "%d.%d.%d.%d",
        ipInt and 0xff, ipInt shr 8 and 0xff, ipInt shr 16 and 0xff, ipInt shr 24 and 0xff
      )
    } catch (e: Exception) {
      ""
    }
    map.putString("ipAddress", ip)
    map.putString("carrierName", "") // best-effort, left blank for now
    return map
  }

  private fun getAppInfo(): WritableMap {
    val map = Arguments.createMap()
    val ctx = reactApplicationContext
    val packageInfo = ctx.packageManager.getPackageInfo(ctx.packageName, 0)
    map.putString("appVersion", packageInfo.versionName ?: "")
    map.putString("buildNumber", packageInfo.longVersionCode.toString())
    map.putString("bundleId", ctx.packageName)
    map.putString(
      "deviceId",
      Settings.Secure.getString(ctx.contentResolver, Settings.Secure.ANDROID_ID) ?: ""
    )
    return map
  }

  companion object {
    const val NAME = "MobileDeviceInfo"
  }
}
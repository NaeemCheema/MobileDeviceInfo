package com.mobiledeviceinfo.datepicker

import android.app.Activity
import android.app.AlertDialog
import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.text.format.DateFormat
import com.facebook.fbreact.specs.NativeDatePickerSpec
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import java.util.Calendar
import java.util.concurrent.atomic.AtomicBoolean

class DatePickerModule(reactContext: ReactApplicationContext) :
    NativeDatePickerSpec(reactContext) {

  // AtomicBoolean gives the busy-check an atomic compare-and-set instead of a
  // separate read-then-write, so two open() calls racing on different threads
  // can't both observe "not showing" and proceed concurrently.
  private val isPickerShowing = AtomicBoolean(false)

  // @Volatile guarantees a dialog set on the UI thread is visible to
  // invalidate(), which may run on a different thread.
  @Volatile private var activeDialog: AlertDialog? = null

  override fun getName() = NAME

  override fun invalidate() {
    super.invalidate()
    activeDialog?.dismiss()
    activeDialog = null
    isPickerShowing.set(false)
  }

  override fun open(options: ReadableMap, promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("E_NO_ACTIVITY", "Unable to find an activity to present the date picker from.")
      return
    }
    val mode = if (options.hasKey("mode")) options.getString("mode") else null
    if (mode != "date" && mode != "time" && mode != "datetime") {
      promise.reject("E_INVALID_MODE", "Unsupported date picker mode: $mode")
      return
    }
    val display = if (options.hasKey("display")) options.getString("display") else null

    val initial = Calendar.getInstance()
    if (options.hasKey("value") && !options.isNull("value")) {
      initial.timeInMillis = options.getDouble("value").toLong()
    }
    val minDate = if (options.hasKey("minimumDate") && !options.isNull("minimumDate")) {
      options.getDouble("minimumDate").toLong()
    } else null
    val maxDate = if (options.hasKey("maximumDate") && !options.isNull("maximumDate")) {
      options.getDouble("maximumDate").toLong()
    } else null

    // Atomic compare-and-set: the only point where two concurrent open()
    // calls can contend, so this is the only check that needs to be atomic.
    if (!isPickerShowing.compareAndSet(false, true)) {
      promise.reject("E_DATE_PICKER_BUSY", "A date picker is already being presented.")
      return
    }

    activity.runOnUiThread {
      when (mode) {
        "date" -> showDatePicker(activity, initial, minDate, maxDate, display) { result ->
          finish(result, initial, promise)
        }
        "time" -> showTimePicker(activity, initial, display) { result ->
          finish(result, initial, promise)
        }
        else -> showDatePicker(activity, initial, minDate, maxDate, display) { dateResult ->
          if (dateResult == null) {
            finish(null, initial, promise)
          } else {
            showTimePicker(activity, dateResult, display) { dateTimeResult ->
              finish(dateTimeResult, initial, promise)
            }
          }
        }
      }
    }
  }

  private fun themeResId(display: String?): Int =
      if (display == "spinner") android.R.style.Theme_Holo_Light_Dialog else 0

  private fun showDatePicker(
    activity: Activity,
    initial: Calendar,
    minDate: Long?,
    maxDate: Long?,
    display: String?,
    onResult: (Calendar?) -> Unit,
  ) {
    val dialog = DatePickerDialog(
      activity,
      themeResId(display),
      { _, year, month, dayOfMonth ->
        onResult((initial.clone() as Calendar).apply {
          set(Calendar.YEAR, year)
          set(Calendar.MONTH, month)
          set(Calendar.DAY_OF_MONTH, dayOfMonth)
        })
      },
      initial.get(Calendar.YEAR),
      initial.get(Calendar.MONTH),
      initial.get(Calendar.DAY_OF_MONTH),
    )
    minDate?.let { dialog.datePicker.minDate = it }
    maxDate?.let { dialog.datePicker.maxDate = it }
    dialog.setOnCancelListener { onResult(null) }
    dialog.setOnDismissListener { activeDialog = null }
    activeDialog = dialog
    dialog.show()
  }

  private fun showTimePicker(
    activity: Activity,
    initial: Calendar,
    display: String?,
    onResult: (Calendar?) -> Unit,
  ) {
    val dialog = TimePickerDialog(
      activity,
      themeResId(display),
      { _, hourOfDay, minute ->
        onResult((initial.clone() as Calendar).apply {
          set(Calendar.HOUR_OF_DAY, hourOfDay)
          set(Calendar.MINUTE, minute)
          set(Calendar.SECOND, 0)
        })
      },
      initial.get(Calendar.HOUR_OF_DAY),
      initial.get(Calendar.MINUTE),
      DateFormat.is24HourFormat(activity),
    )
    dialog.setOnCancelListener { onResult(null) }
    dialog.setOnDismissListener { activeDialog = null }
    activeDialog = dialog
    dialog.show()
  }

  private fun finish(result: Calendar?, initial: Calendar, promise: Promise) {
    isPickerShowing.set(false)
    val resultCalendar = result ?: initial
    val map = Arguments.createMap()
    map.putDouble("value", resultCalendar.timeInMillis.toDouble())
    map.putBoolean("cancelled", result == null)
    promise.resolve(map)
  }

  companion object {
    const val NAME = "DatePicker"
  }
}
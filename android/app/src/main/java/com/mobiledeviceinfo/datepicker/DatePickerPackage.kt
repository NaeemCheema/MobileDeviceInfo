package com.mobiledeviceinfo.datepicker

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class DatePickerPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return if (name == DatePickerModule.NAME) DatePickerModule(reactContext) else null
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      mapOf(
        DatePickerModule.NAME to ReactModuleInfo(
          DatePickerModule.NAME,
          DatePickerModule.NAME,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          true,  // hasConstants — irrelevant for TurboModules, keep true
          false, // isCxxModule
          true   // isTurboModule
        )
      )
    }
  }
}
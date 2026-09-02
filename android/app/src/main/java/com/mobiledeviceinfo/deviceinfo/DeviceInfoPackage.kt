package com.mobiledeviceinfo.deviceinfo

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class DeviceInfoPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return if (name == DeviceInfoModule.NAME) DeviceInfoModule(reactContext) else null
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      mapOf(
        DeviceInfoModule.NAME to ReactModuleInfo(
          DeviceInfoModule.NAME,
          DeviceInfoModule.NAME,
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
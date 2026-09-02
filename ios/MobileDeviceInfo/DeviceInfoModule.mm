#import <React/RCTBridgeModule.h>
#import <ReactCommon/RCTTurboModule.h>

#import "NativeMobileDeviceInfoSpec/NativeMobileDeviceInfoSpec.h"

@interface RCT_EXTERN_REMAP_MODULE(MobileDeviceInfo, DeviceInfoModule, NSObject)

RCT_EXTERN_METHOD(getDeviceInfo
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject)

@end

@interface DeviceInfoModule (NativeMobileDeviceInfoSpec) <NativeMobileDeviceInfoSpec>
@end

@implementation DeviceInfoModule (NativeMobileDeviceInfoSpecCompatibility)

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeMobileDeviceInfoSpecJSI>(params);
}

@end

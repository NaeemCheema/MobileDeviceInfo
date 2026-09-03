#import "DeviceInfoModule.h"

#import <CoreTelephony/CTCarrier.h>
#import <CoreTelephony/CTTelephonyNetworkInfo.h>
#import <UIKit/UIKit.h>
#import <ifaddrs.h>
#import <netdb.h>

using namespace facebook::react;

@implementation DeviceInfoModule

RCT_EXPORT_MODULE(MobileDeviceInfo)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (instancetype)init
{
  if (self = [super init]) {
    UIDevice.currentDevice.batteryMonitoringEnabled = YES;
    [[NSNotificationCenter defaultCenter] addObserver:self
                                              selector:@selector(batteryStatusDidChange:)
                                                  name:UIDeviceBatteryLevelDidChangeNotification
                                                object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                              selector:@selector(batteryStatusDidChange:)
                                                  name:UIDeviceBatteryStateDidChangeNotification
                                                object:nil];
  }
  return self;
}

- (void)invalidate
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  UIDevice.currentDevice.batteryMonitoringEnabled = NO;
}

- (void)batteryStatusDidChange:(NSNotification *)notification
{
  [self emitOnBatteryLevelChanged:[self batteryInfo]];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeMobileDeviceInfoSpecJSI>(params);
}

#pragma mark - Spec Methods

- (void)getDeviceInfo:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  // hardwareInfo/batteryInfo/appInfo read UIKit state (UIScreen, UIDevice) which
  // must only be accessed from the main thread. This module doesn't implement
  // -methodQueue, so RCTTurboModuleManager dispatches method calls on its own
  // private background queue by default - hop to main explicitly.
  dispatch_async(dispatch_get_main_queue(), ^{
  resolve(@{
    @"hardware" : [self hardwareInfo],
    @"battery" : [self batteryInfo],
    @"storage" : [self storageInfo],
    @"network" : [self networkInfo],
    @"app" : [self appInfo],
  });
  });
}

#pragma mark - Sections

- (NSDictionary *)hardwareInfo
{
  UIScreen *screen = UIScreen.mainScreen;
  return @{
    @"model" : UIDevice.currentDevice.model,
    @"manufacturer" : @"Apple",
    @"osName" : UIDevice.currentDevice.systemName,
    @"osVersion" : UIDevice.currentDevice.systemVersion,
    @"screenWidth" : @(screen.bounds.size.width * screen.scale),
    @"screenHeight" : @(screen.bounds.size.height * screen.scale),
    @"screenDensity" : @(screen.scale),
  };
}

- (NSDictionary *)batteryInfo
{
  UIDevice *device = UIDevice.currentDevice;
  float level = device.batteryLevel;
  BOOL isCharging = device.batteryState == UIDeviceBatteryStateCharging ||
      device.batteryState == UIDeviceBatteryStateFull;
  return @{
    @"level" : @(level >= 0 ? level : -1.0),
    @"isCharging" : @(isCharging),
  };
}

- (NSDictionary *)storageInfo
{
  double total = 0;
  double free = 0;
  NSDictionary *attrs = [NSFileManager.defaultManager attributesOfFileSystemForPath:NSHomeDirectory() error:nil];
  if (attrs) {
    total = [attrs[NSFileSystemSize] doubleValue];
    free = [attrs[NSFileSystemFreeSize] doubleValue];
  }
  return @{
    @"totalStorage" : @(total),
    @"freeStorage" : @(free),
  };
}

- (NSDictionary *)networkInfo
{
  NSString *ipAddress = @"";
  NSString *connectionType = @"none";

  struct ifaddrs *interfaces = NULL;
  if (getifaddrs(&interfaces) == 0) {
    for (struct ifaddrs *ifa = interfaces; ifa != NULL; ifa = ifa->ifa_next) {
      if (ifa->ifa_addr == NULL || ifa->ifa_addr->sa_family != AF_INET) {
        continue;
      }
      NSString *name = [NSString stringWithUTF8String:ifa->ifa_name];
      char host[NI_MAXHOST];
      getnameinfo(ifa->ifa_addr, ifa->ifa_addr->sa_len, host, sizeof(host), NULL, 0, NI_NUMERICHOST);
      NSString *ip = [NSString stringWithUTF8String:host];

      if ([name isEqualToString:@"en0"]) {
        ipAddress = ip;
        connectionType = @"wifi";
        break;
      } else if ([name hasPrefix:@"pdp_ip"]) {
        ipAddress = ip;
        connectionType = @"cellular";
      }
    }
    freeifaddrs(interfaces);
  }

  // Best-effort: CTCarrier is deprecated since iOS 16 and commonly returns
  // empty values on modern hardware/carriers.
  NSString *carrierName = @"";
  CTTelephonyNetworkInfo *telephonyInfo = [CTTelephonyNetworkInfo new];
  CTCarrier *carrier = telephonyInfo.serviceSubscriberCellularProviders.allValues.firstObject;
  if (carrier.carrierName) {
    carrierName = carrier.carrierName;
  }

  return @{
    @"ipAddress" : ipAddress,
    @"connectionType" : connectionType,
    @"carrierName" : carrierName,
  };
}

- (NSDictionary *)appInfo
{
  NSDictionary *info = NSBundle.mainBundle.infoDictionary;
  return @{
    @"appVersion" : info[@"CFBundleShortVersionString"] ?: @"",
    @"buildNumber" : info[@"CFBundleVersion"] ?: @"",
    @"bundleId" : NSBundle.mainBundle.bundleIdentifier ?: @"",
    @"deviceId" : UIDevice.currentDevice.identifierForVendor.UUIDString ?: @"",
  };
}

@end

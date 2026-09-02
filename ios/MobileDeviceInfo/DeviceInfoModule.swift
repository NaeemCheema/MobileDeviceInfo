import CoreTelephony
import Foundation
import React
import UIKit

@objc(DeviceInfoModule)
class DeviceInfoModule: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }

  @objc
  func getDeviceInfo(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      let result: [String: Any] = [
        "hardware": self.hardwareInfo(),
        "battery": self.batteryInfo(),
        "storage": self.storageInfo(),
        "network": self.networkInfo(),
        "app": self.appInfo(),
      ]
      resolve(result)
    }
  }

  private func hardwareInfo() -> [String: Any] {
    let screen = UIScreen.main
    return [
      "model": UIDevice.current.model,
      "manufacturer": "Apple",
      "osName": UIDevice.current.systemName,
      "osVersion": UIDevice.current.systemVersion,
      "screenWidth": Int(screen.bounds.width * screen.scale),
      "screenHeight": Int(screen.bounds.height * screen.scale),
      "screenDensity": Double(screen.scale),
    ]
  }

  private func batteryInfo() -> [String: Any] {
    let device = UIDevice.current
    device.isBatteryMonitoringEnabled = true
    let level = device.batteryLevel
    let isCharging = device.batteryState == .charging || device.batteryState == .full
    return [
      "level": level >= 0 ? Double(level) : -1.0,
      "isCharging": isCharging,
    ]
  }

  private func storageInfo() -> [String: Any] {
    var total: Double = 0
    var free: Double = 0
    if let attributes = try? FileManager.default.attributesOfFileSystem(forPath: NSHomeDirectory()) {
      total = (attributes[.systemSize] as? NSNumber)?.doubleValue ?? 0
      free = (attributes[.systemFreeSize] as? NSNumber)?.doubleValue ?? 0
    }
    return [
      "totalStorage": total,
      "freeStorage": free,
    ]
  }

  private func networkInfo() -> [String: Any] {
    var ipAddress = ""
    var connectionType = "none"

    var ifaddrPointer: UnsafeMutablePointer<ifaddrs>?
    if getifaddrs(&ifaddrPointer) == 0 {
      var pointer = ifaddrPointer
      while let current = pointer {
        defer { pointer = current.pointee.ifa_next }

        let interface = current.pointee
        guard interface.ifa_addr.pointee.sa_family == UInt8(AF_INET) else { continue }

        let name = String(cString: interface.ifa_name)
        var address = [CChar](repeating: 0, count: Int(NI_MAXHOST))
        getnameinfo(
          interface.ifa_addr, socklen_t(interface.ifa_addr.pointee.sa_len),
          &address, socklen_t(address.count), nil, 0, NI_NUMERICHOST
        )
        let ip = String(cString: address)

        if name == "en0" {
          ipAddress = ip
          connectionType = "wifi"
          break
        } else if name.hasPrefix("pdp_ip") {
          ipAddress = ip
          connectionType = "cellular"
        }
      }
      freeifaddrs(ifaddrPointer)
    }

    // Best-effort: CTCarrier is deprecated since iOS 16 and commonly returns
    // empty values on modern hardware/carriers. We surface whatever the API
    // gives us rather than hiding the limitation.
    var carrierName = ""
    let networkInfo = CTTelephonyNetworkInfo()
    if let providers = networkInfo.serviceSubscriberCellularProviders,
       let carrier = providers.values.first {
      carrierName = carrier.carrierName ?? ""
    }

    return [
      "ipAddress": ipAddress,
      "connectionType": connectionType,
      "carrierName": carrierName,
    ]
  }

  private func appInfo() -> [String: Any] {
    let bundle = Bundle.main
    return [
      "appVersion": bundle.infoDictionary?["CFBundleShortVersionString"] as? String ?? "",
      "buildNumber": bundle.infoDictionary?["CFBundleVersion"] as? String ?? "",
      "bundleId": bundle.bundleIdentifier ?? "",
      "deviceId": UIDevice.current.identifierForVendor?.uuidString ?? "",
    ]
  }
}

import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";


// device hardware info
export interface HardwareInfo {
    model: string;
    manufacturer: string;
    osName: string;
    osVersion: string;
    screenWidth: number;
    screenHeight: number;
    screenDensity: number;
}


// device battery info
export interface BatteryInfo {
    level: number;
    isCharging: boolean;
}


// device storage info
export interface StorageInfo {
    totalStorage: number; // bytes
    freeStorage: number; // bytes
}

// device network info
export interface NetworkInfo {
    ipAddress: string;
    connectionType: string;
    carrierName: string;
}

// device app info
export interface AppInfo {
  appVersion: string;
  buildNumber: string;
  bundleId: string;
  deviceId: string;
}

// device info response
export interface NativeDeviceInfoResult {
    hardware: HardwareInfo;
    battery: BatteryInfo;
    storage: StorageInfo;
    network: NetworkInfo;
    app: AppInfo;
}

export interface Spec extends TurboModule {
    getDeviceInfo: () => Promise<NativeDeviceInfoResult>;
}

export default TurboModuleRegistry.getEnforcing<Spec>("MobileDeviceInfo");
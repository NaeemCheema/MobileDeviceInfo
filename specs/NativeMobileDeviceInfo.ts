import type { CodegenTypes, TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

// device hardware info
interface HardwareInfo {
  model: string;
  manufacturer: string;
  osName: string;
  osVersion: string;
  screenWidth: number;
  screenHeight: number;
  screenDensity: number;
}

// device battery info
interface BatteryInfo {
  level: number;
  isCharging: boolean;
}

// device storage info
interface StorageInfo {
  totalStorage: number; // bytes
  freeStorage: number; // bytes
}

// device network info
interface NetworkInfo {
  ipAddress: string;
  connectionType: string;
  carrierName: string;
}

// device app info
interface AppInfo {
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
  readonly onBatteryLevelChanged: CodegenTypes.EventEmitter<BatteryInfo>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('MobileDeviceInfo');

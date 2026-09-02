/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('../specs/NativeMobileDeviceInfo', () => ({
  __esModule: true,
  default: {
    getDeviceInfo: jest.fn().mockResolvedValue({
      hardware: {
        model: 'Test Model',
        manufacturer: 'Test Manufacturer',
        osName: 'TestOS',
        osVersion: '1.0',
        screenWidth: 1080,
        screenHeight: 1920,
        screenDensity: 2,
      },
      battery: { level: 0.5, isCharging: false },
      storage: { totalStorage: 128000000000, freeStorage: 64000000000 },
      network: { ipAddress: '192.168.1.1', connectionType: 'wifi', carrierName: '' },
      app: {
        appVersion: '1.0.0',
        buildNumber: '1',
        bundleId: 'com.mobiledeviceinfo',
        deviceId: 'test-device-id',
      },
    }),
  },
}));

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});

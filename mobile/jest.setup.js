// Jest setup file
import 'react-native-gesture-handler/jestSetup';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-image-picker
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));

// Mock react-native-document-picker
jest.mock('react-native-document-picker', () => ({
  pick: jest.fn(),
  types: {
    allFiles: 'allFiles',
  },
}));

// Mock react-native-chart-kit
jest.mock('react-native-chart-kit', () => ({
  LineChart: 'LineChart',
  PieChart: 'PieChart',
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => 'Svg');

// Mock react-native-calendars
jest.mock('react-native-calendars', () => 'Calendar');

// Mock react-native-modal
jest.mock('react-native-modal', () => 'Modal');

// Mock react-native-toast-message
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

// Mock react-native-keychain
jest.mock('react-native-keychain', () => ({
  getInternetCredentials: jest.fn(),
  setInternetCredentials: jest.fn(),
  resetInternetCredentials: jest.fn(),
}));

// Mock react-native-biometrics
jest.mock('react-native-biometrics', () => ({
  isSensorAvailable: jest.fn(),
  simplePrompt: jest.fn(),
}));

// Mock react-native-qrcode-scanner
jest.mock('react-native-qrcode-scanner', () => 'QRCodeScanner');

// Mock react-native-permissions
jest.mock('react-native-permissions', () => ({
  PERMISSIONS: {
    ANDROID: {},
    IOS: {},
  },
  request: jest.fn(),
  check: jest.fn(),
}));

// Mock react-native-device-info
jest.mock('react-native-device-info', () => ({
  getVersion: jest.fn(),
  getBuildNumber: jest.fn(),
  getDeviceId: jest.fn(),
  getSystemName: jest.fn(),
  getSystemVersion: jest.fn(),
}));

// Mock react-native-network-info
jest.mock('react-native-network-info', () => ({
  getSSID: jest.fn(),
  getIPAddress: jest.fn(),
}));

// Mock react-native-background-timer
jest.mock('react-native-background-timer', () => ({
  start: jest.fn(),
  stop: jest.fn(),
  setTimeout: jest.fn(),
  clearTimeout: jest.fn(),
}));

// Mock react-native-push-notification
jest.mock('react-native-push-notification', () => ({
  configure: jest.fn(),
  onRegister: jest.fn(),
  onNotification: jest.fn(),
  requestPermissions: jest.fn(),
  createChannel: jest.fn(),
  localNotification: jest.fn(),
  scheduleLocalNotification: jest.fn(),
  cancelLocalNotification: jest.fn(),
  cancelAllLocalNotifications: jest.fn(),
}));

// Mock react-native-local-notifications
jest.mock('react-native-local-notifications', () => ({
  createNotification: jest.fn(),
  scheduleNotification: jest.fn(),
  cancelNotification: jest.fn(),
  cancelAllNotifications: jest.fn(),
}));

// Mock react-native-fs
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/data',
  ExternalDirectoryPath: '/storage/emulated/0',
  ExternalStorageDirectoryPath: '/storage/emulated/0',
  TemporaryDirectoryPath: '/tmp',
  LibraryDirectoryPath: '/var/mobile/Containers/Data/Application',
  CachesDirectoryPath: '/var/mobile/Containers/Data/Application/Caches',
  readFile: jest.fn(),
  writeFile: jest.fn(),
  exists: jest.fn(),
  mkdir: jest.fn(),
  copyFile: jest.fn(),
  moveFile: jest.fn(),
  unlink: jest.fn(),
  readDir: jest.fn(),
  stat: jest.fn(),
}));

// Global mocks
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

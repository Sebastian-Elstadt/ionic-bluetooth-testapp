import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.elstadt.apps.bluetoothmaster',
  appName: 'Bluetooth Master',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  }
};

export default config;

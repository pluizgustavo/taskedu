import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.taskedu.app',
  appName: 'TaskEdu',
  webDir: 'dist',
  server: {
    cleartext: true,
  },
};

export default config;

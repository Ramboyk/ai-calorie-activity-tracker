import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nutritrack.ai',
  appName: 'NutriTrack AI',
  webDir: 'public',
  server: {
    url: 'https://ai-calorie-activity-tracker.vercel.app',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;

import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Lazy-import to avoid crashing in Expo Go / web where native module is absent
let Purchases: typeof import('react-native-purchases').default | null = null;
let LOG_LEVEL: typeof import('react-native-purchases').LOG_LEVEL | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('react-native-purchases');
  Purchases = mod.default;
  LOG_LEVEL = mod.LOG_LEVEL;
} catch {
  console.warn('[Subscriptions] react-native-purchases native module not available (Expo Go / web).');
}

// Production API keys — populated via eas.json env vars
const API_KEYS = {
  apple: process.env.EXPO_PUBLIC_REVENUECAT_APPLE || 'appl_placeholder',
  google: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE || 'goog_placeholder',
};

export const initSubscriptions = async () => {
  if (Platform.OS === 'web' || !Purchases || !LOG_LEVEL) return;

  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  if (isExpoGo) {
    console.log('[Subscriptions] Skipping RevenueCat init: not supported in Expo Go');
    return;
  }

  Purchases.setLogLevel(LOG_LEVEL.DEBUG);

  try {
    if (Platform.OS === 'ios') {
      Purchases.configure({ apiKey: API_KEYS.apple });
    } else if (Platform.OS === 'android') {
      Purchases.configure({ apiKey: API_KEYS.google });
    }
  } catch (error) {
    console.warn('[Subscriptions] Configure failed:', error);
  }
};

export const getOfferings = async () => {
  if (!Purchases) return [];
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current !== null) {
      return offerings.current.availablePackages;
    }
    return [];
  } catch (e) {
    console.warn('Failed to get offerings:', e);
    return [];
  }
};

export const purchasePackage = async (packageToBuy: any): Promise<boolean> => {
  if (!Purchases) return false;
  try {
    // SDK v8+: purchasePackage returns { customerInfo } — productIdentifier was removed
    const { customerInfo } = await Purchases.purchasePackage(packageToBuy);

    // Check entitlements — adjust 'pro' key to match your RevenueCat dashboard
    return typeof customerInfo.entitlements.active['pro'] !== 'undefined';
  } catch (e: any) {
    if (e?.userCancelled) return false; // User dismissed the sheet — not an error
    console.error('[Subscriptions] Purchase error:', e);
    throw e;
  }
};

export const restorePurchases = async (): Promise<boolean> => {
  if (!Purchases) return false;
  try {
    const customerInfo = await Purchases.restorePurchases();
    return typeof customerInfo.entitlements.active['pro'] !== 'undefined';
  } catch (e) {
    console.warn('[Subscriptions] Restore error:', e);
    return false;
  }
};

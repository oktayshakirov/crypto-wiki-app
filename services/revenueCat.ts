import { Platform } from "react-native";
import Constants from "expo-constants";
import { DEFAULT_REVENUECAT_ENTITLEMENT } from "@/constants/revenueCat";

type RevenueCatRuntimeConfig = {
  apiKey?: string;
  iosApiKey?: string;
  androidApiKey?: string;
  entitlementId?: string;
};

type CustomerInfo = {
  entitlements?: {
    active?: Record<string, unknown>;
  };
};

let isConfigured = false;

function getRevenueCatConfig(): RevenueCatRuntimeConfig {
  const extra = Constants.expoConfig?.extra ?? {};
  const rcConfig = (extra.revenueCat ?? {}) as RevenueCatRuntimeConfig;
  return rcConfig;
}

export function getEntitlementId() {
  return getRevenueCatConfig().entitlementId || DEFAULT_REVENUECAT_ENTITLEMENT;
}

function getRevenueCatApiKey() {
  const config = getRevenueCatConfig();
  const sharedEnv =
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ||
    process.env.REVENUECAT_API_KEY ||
    "";
  const iosEnv =
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS ||
    process.env.REVENUECAT_API_KEY_IOS ||
    "";
  const androidEnv =
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID ||
    process.env.REVENUECAT_API_KEY_ANDROID ||
    "";

  if (Platform.OS === "ios") {
    return iosEnv || sharedEnv || config.iosApiKey || config.apiKey || "";
  }
  if (Platform.OS === "android") {
    return (
      androidEnv || sharedEnv || config.androidApiKey || config.apiKey || ""
    );
  }
  return "";
}

function getPurchasesModule() {
  const purchases = require("react-native-purchases");
  return purchases.default ?? purchases;
}

export function isRevenueCatSupported() {
  return Platform.OS === "ios" || Platform.OS === "android";
}

export async function configureRevenueCat() {
  if (!isRevenueCatSupported()) return false;
  if (isConfigured) return true;

  const apiKey = getRevenueCatApiKey().trim();
  if (!apiKey) return false;

  const Purchases = getPurchasesModule();
  if (__DEV__) {
    await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
  }
  Purchases.configure({ apiKey });
  isConfigured = true;
  return true;
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isRevenueCatSupported() || !isConfigured) return null;
  const Purchases = getPurchasesModule();
  return (await Purchases.getCustomerInfo()) as CustomerInfo;
}

export function hasProEntitlement(customerInfo: CustomerInfo | null): boolean {
  if (!customerInfo?.entitlements?.active) return false;
  return Boolean(customerInfo.entitlements.active[getEntitlementId()]);
}

export async function presentPaywall() {
  if (!isRevenueCatSupported()) return false;
  const RevenueCatUIImport = require("react-native-purchases-ui");
  const RevenueCatUI = RevenueCatUIImport.default ?? RevenueCatUIImport;
  await RevenueCatUI.presentPaywall({ displayCloseButton: true });
  return true;
}

export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!isRevenueCatSupported() || !isConfigured) return null;
  const Purchases = getPurchasesModule();
  return (await Purchases.restorePurchases()) as CustomerInfo;
}

export function addCustomerInfoUpdateListener(
  listener: (customerInfo: CustomerInfo) => void
) {
  if (!isRevenueCatSupported() || !isConfigured) {
    return () => {};
  }
  const Purchases = getPurchasesModule();
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
}

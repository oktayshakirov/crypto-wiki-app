import { Platform } from "react-native";
import { DEFAULT_REVENUECAT_ENTITLEMENT } from "@/constants/revenueCat";

type CustomerInfo = {
  entitlements?: {
    active?: Record<string, unknown>;
  };
};

export type PlanLabel = "Free" | "Monthly" | "Pro" | "Lifetime";

let isConfigured = false;

export function getEntitlementId() {
  return DEFAULT_REVENUECAT_ENTITLEMENT;
}

function getRevenueCatApiKey() {
  const sharedEnv = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || "";
  const iosEnv = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || "";
  const androidEnv = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || "";

  if (Platform.OS === "ios") {
    return iosEnv || sharedEnv;
  }
  if (Platform.OS === "android") {
    return androidEnv || sharedEnv;
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
  if (!apiKey) {
    if (__DEV__) {
      console.warn(
        "[RevenueCat] Missing API key. Use EXPO_PUBLIC_REVENUECAT_API_KEY or platform-specific EXPO_PUBLIC_REVENUECAT_API_KEY_IOS / EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID in .env and restart Metro."
      );
    }
    return false;
  }

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

export function getPlanLabel(customerInfo: CustomerInfo | null): PlanLabel {
  if (!hasProEntitlement(customerInfo)) return "Free";
  const entitlement = customerInfo?.entitlements?.active?.[getEntitlementId()] as
    | { productIdentifier?: string }
    | undefined;
  const id = (entitlement?.productIdentifier ?? "").toLowerCase();
  if (id.includes("lifetime")) return "Lifetime";
  if (id.includes("month") || id.includes("annual") || id.includes("year")) {
    return "Monthly";
  }
  return "Pro";
}

export async function presentPaywall() {
  if (!isRevenueCatSupported()) return false;

  if (!isConfigured) {
    const configured = await configureRevenueCat();
    if (!configured) {
      return false;
    }
  }

  const customerInfo = await getCustomerInfo();
  if (hasProEntitlement(customerInfo)) {
    return false;
  }

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

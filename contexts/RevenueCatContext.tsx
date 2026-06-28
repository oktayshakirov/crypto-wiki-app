import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addCustomerInfoUpdateListener,
  configureRevenueCat,
  getCustomerInfo,
  getPlanLabel,
  hasProEntitlement,
  isRevenueCatSupported,
  PlanLabel,
  presentPaywall,
  restorePurchases,
} from "@/services/revenueCat";

const DEV_PRO_OVERRIDE_KEY = "devProOverride";

type RevenueCatContextValue = {
  isPro: boolean;
  isReady: boolean;
  isSupported: boolean;
  planLabel: PlanLabel;
  showPaywall: () => Promise<boolean>;
  refreshCustomerInfo: () => Promise<void>;
  restoreUserPurchases: () => Promise<boolean>;
  // Developer-only override (no-op in production builds)
  devProOverride: boolean | null;
  setDevProOverride: (value: boolean | null) => Promise<void>;
};

const RevenueCatContext = createContext<RevenueCatContextValue | null>(null);

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const [realIsPro, setRealIsPro] = useState(false);
  const [realPlanLabel, setRealPlanLabel] = useState<PlanLabel>("Free");
  const [isReady, setIsReady] = useState(false);
  const [devProOverride, setDevProOverrideState] = useState<boolean | null>(
    null
  );
  const isSupported = isRevenueCatSupported();

  const isPro = __DEV__ && devProOverride !== null ? devProOverride : realIsPro;
  const planLabel: PlanLabel =
    __DEV__ && devProOverride !== null
      ? devProOverride
        ? "Pro"
        : "Free"
      : realPlanLabel;

  const refreshCustomerInfo = useCallback(async () => {
    const customerInfo = await getCustomerInfo();
    setRealIsPro(hasProEntitlement(customerInfo));
    setRealPlanLabel(getPlanLabel(customerInfo));
  }, []);

  // Load persisted developer override (dev builds only)
  useEffect(() => {
    if (!__DEV__) return;
    AsyncStorage.getItem(DEV_PRO_OVERRIDE_KEY).then((stored) => {
      if (stored === "true") setDevProOverrideState(true);
      else if (stored === "false") setDevProOverrideState(false);
    });
  }, []);

  const setDevProOverride = useCallback(async (value: boolean | null) => {
    setDevProOverrideState(value);
    if (value === null) {
      await AsyncStorage.removeItem(DEV_PRO_OVERRIDE_KEY);
    } else {
      await AsyncStorage.setItem(DEV_PRO_OVERRIDE_KEY, value ? "true" : "false");
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const configured = await configureRevenueCat();
      if (!mounted) return;

      if (configured) {
        await refreshCustomerInfo();
      }
      if (mounted) {
        setIsReady(true);
      }
    })().catch(() => {
      if (mounted) setIsReady(true);
    });

    return () => {
      mounted = false;
    };
  }, [refreshCustomerInfo]);

  useEffect(() => {
    if (!isSupported || !isReady) return;
    const unsubscribe = addCustomerInfoUpdateListener((customerInfo) => {
      setRealIsPro(hasProEntitlement(customerInfo));
      setRealPlanLabel(getPlanLabel(customerInfo));
    });
    return unsubscribe;
  }, [isSupported, isReady]);

  const showPaywall = useCallback(async () => {
    if (isPro) {
      return false;
    }
    try {
      const shown = await presentPaywall();
      await refreshCustomerInfo();
      return shown;
    } catch {
      await refreshCustomerInfo();
      return false;
    }
  }, [isPro, refreshCustomerInfo]);

  const restoreUserPurchases = useCallback(async () => {
    try {
      const customerInfo = await restorePurchases();
      const pro = hasProEntitlement(customerInfo);
      setRealIsPro(pro);
      setRealPlanLabel(getPlanLabel(customerInfo));
      return pro;
    } catch {
      return false;
    }
  }, []);

  const value = useMemo(
    () => ({
      isPro,
      isReady,
      isSupported,
      planLabel,
      showPaywall,
      refreshCustomerInfo,
      restoreUserPurchases,
      devProOverride,
      setDevProOverride,
    }),
    [
      isPro,
      isReady,
      isSupported,
      planLabel,
      showPaywall,
      refreshCustomerInfo,
      restoreUserPurchases,
      devProOverride,
      setDevProOverride,
    ]
  );

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
}

export function useRevenueCat() {
  const context = useContext(RevenueCatContext);
  if (!context) {
    throw new Error("useRevenueCat must be used within RevenueCatProvider");
  }
  return context;
}

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  addCustomerInfoUpdateListener,
  configureRevenueCat,
  getCustomerInfo,
  hasProEntitlement,
  isRevenueCatSupported,
  presentPaywall,
  restorePurchases,
} from "@/services/revenueCat";

type RevenueCatContextValue = {
  isPro: boolean;
  isReady: boolean;
  isSupported: boolean;
  showPaywall: () => Promise<boolean>;
  refreshCustomerInfo: () => Promise<void>;
  restoreUserPurchases: () => Promise<boolean>;
};

const RevenueCatContext = createContext<RevenueCatContextValue | null>(null);

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const isSupported = isRevenueCatSupported();

  const refreshCustomerInfo = useCallback(async () => {
    const customerInfo = await getCustomerInfo();
    setIsPro(hasProEntitlement(customerInfo));
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
      setIsPro(hasProEntitlement(customerInfo));
    });
    return unsubscribe;
  }, [isSupported, isReady]);

  const showPaywall = useCallback(async () => {
    try {
      const shown = await presentPaywall();
      await refreshCustomerInfo();
      return shown;
    } catch {
      await refreshCustomerInfo();
      return false;
    }
  }, [refreshCustomerInfo]);

  const restoreUserPurchases = useCallback(async () => {
    try {
      const customerInfo = await restorePurchases();
      const pro = hasProEntitlement(customerInfo);
      setIsPro(pro);
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
      showPaywall,
      refreshCustomerInfo,
      restoreUserPurchases,
    }),
    [
      isPro,
      isReady,
      isSupported,
      showPaywall,
      refreshCustomerInfo,
      restoreUserPurchases,
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

import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useAdConsent() {
  const [consent, setConsent] = useState<"granted" | "denied" | null>(null);

  useEffect(() => {
    async function loadConsent() {
      try {
        const stored = await AsyncStorage.getItem("trackingConsent");
        setConsent(stored as "granted" | "denied" | null);
      } catch (error) {
        console.error("Failed to load ad consent:", error);
        setConsent(null);
      }
    }

    loadConsent();
  }, []);

  return {
    consent,
    requestNonPersonalizedAdsOnly: consent !== "granted",
  };
}

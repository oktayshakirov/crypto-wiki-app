import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showInterstitial, ensureInterstitialLoaded } from "./InterstitialAd";
import { showAppOpenAd, ensureAppOpenAdLoaded } from "./AppOpenAd";
import { useRevenueCat } from "@/contexts/RevenueCatContext";

const AD_INTERVAL_MS = 60000;
const PAYWALL_EVERY_N_INTERSTITIAL_OPPORTUNITIES = 5;
const INTERSTITIAL_OPPORTUNITY_COUNT_KEY = "interstitialOpportunityCount";

export function initializeGlobalAds() {}

export function useGlobalAds() {
  const { isPro, isReady, isSupported, showPaywall } = useRevenueCat();
  const appState = useRef(AppState.currentState);
  const lastBackgroundTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isPro || !isReady) {
      return;
    }
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        const currentState = appState.current;

        if (
          currentState === "active" &&
          nextAppState.match(/inactive|background/)
        ) {
          lastBackgroundTimeRef.current = Date.now();
        }

        if (
          currentState.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          const now = Date.now();
          const backgroundTime =
            lastBackgroundTimeRef.current > 0
              ? now - lastBackgroundTimeRef.current
              : 0;

          try {
            await Promise.all([
              ensureInterstitialLoaded(backgroundTime),
              ensureAppOpenAdLoaded(backgroundTime),
            ]);
          } catch {
            // Ignore ensure errors, will retry next time
          }

          const lastAdShownString = await AsyncStorage.getItem(
            "lastAdShownTime"
          );
          const lastAdShownTime = lastAdShownString
            ? parseInt(lastAdShownString, 10)
            : 0;

          if (now - lastAdShownTime > AD_INTERVAL_MS) {
            try {
              await showAppOpenAd();
              await AsyncStorage.setItem("lastAdShownTime", now.toString());
            } catch {
              // Ignore show errors
            }
          }
        }

        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [isPro, isReady]);

  const handleGlobalPress = async () => {
    if (isPro || !isReady) {
      return;
    }
    const lastAdShownString = await AsyncStorage.getItem("lastAdShownTime");
    const lastAdShownTime = lastAdShownString
      ? parseInt(lastAdShownString, 10)
      : 0;
    const now = Date.now();

    if (now - lastAdShownTime > AD_INTERVAL_MS) {
      try {
        let opportunityCount = 0;
        const opportunityCountRaw = await AsyncStorage.getItem(
          INTERSTITIAL_OPPORTUNITY_COUNT_KEY
        );
        if (opportunityCountRaw) {
          opportunityCount = parseInt(opportunityCountRaw, 10) || 0;
        }

        const nextOpportunityCount = opportunityCount + 1;
        const shouldShowPaywall =
          isSupported &&
          nextOpportunityCount % PAYWALL_EVERY_N_INTERSTITIAL_OPPORTUNITIES === 0;

        if (shouldShowPaywall) {
          await showPaywall();
        } else {
          await ensureInterstitialLoaded();
          await showInterstitial();
        }

        await AsyncStorage.setItem(
          INTERSTITIAL_OPPORTUNITY_COUNT_KEY,
          nextOpportunityCount.toString()
        );
        await AsyncStorage.setItem("lastAdShownTime", now.toString());
      } catch {}
    }
  };

  return { handleGlobalPress };
}

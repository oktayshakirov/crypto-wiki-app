import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showInterstitial, ensureInterstitialLoaded } from "./InterstitialAd";
import { showAppOpenAd, ensureAppOpenAdLoaded } from "./AppOpenAd";
import { useRevenueCat } from "@/contexts/RevenueCatContext";

const AD_INTERVAL_MS = 60000;
// Show the paywall once per app session, on the Nth ad opportunity. After that,
// every opportunity is a normal interstitial until the app is reopened.
const PAYWALL_ON_NTH_OPPORTUNITY = 2;

export function initializeGlobalAds() {}

export function useGlobalAds() {
  const { isPro, isReady, isSupported, showPaywall } = useRevenueCat();
  const appState = useRef(AppState.currentState);
  const lastBackgroundTimeRef = useRef<number>(0);
  // Per-session counters (reset on every foreground / cold start).
  const sessionOpportunityCountRef = useRef(0);
  const paywallShownThisSessionRef = useRef(false);

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
          // New foreground session: reset the per-session paywall counters.
          sessionOpportunityCountRef.current = 0;
          paywallShownThisSessionRef.current = false;

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
        const nextOpportunityCount = sessionOpportunityCountRef.current + 1;
        sessionOpportunityCountRef.current = nextOpportunityCount;

        const shouldShowPaywall =
          isSupported &&
          !paywallShownThisSessionRef.current &&
          nextOpportunityCount === PAYWALL_ON_NTH_OPPORTUNITY;

        if (shouldShowPaywall) {
          paywallShownThisSessionRef.current = true;
          await showPaywall();
        } else {
          await ensureInterstitialLoaded();
          await showInterstitial();
        }

        await AsyncStorage.setItem("lastAdShownTime", now.toString());
      } catch {}
    }
  };

  return { handleGlobalPress };
}

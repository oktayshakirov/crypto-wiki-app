import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { showInterstitial, initializeInterstitial } from "./InterstitialAd";
import { showAppOpenAd } from "./AppOpenAd";

export function useGlobalAds() {
  const lastInterstitialTime = useRef(0);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    initializeInterstitial();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          try {
            await showAppOpenAd();
          } catch (e) {
            console.log("AppOpenAd error", e);
          }
        }
        appState.current = nextAppState;
      }
    );
    return () => subscription.remove();
  }, []);

  const handleGlobalPress = async () => {
    const now = Date.now();
    if (now - lastInterstitialTime.current > 60000) {
      await showInterstitial();
      lastInterstitialTime.current = now;
    }
  };

  return { handleGlobalPress };
}

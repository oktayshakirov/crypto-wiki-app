import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showInterstitial } from "./InterstitialAd";
import { showAppOpenAd } from "./AppOpenAd";

const AD_INTERVAL_MS = 60000; // 1 minute

export function initializeGlobalAds() {}

export function useGlobalAds() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          const lastAdShownString = await AsyncStorage.getItem(
            "lastAdShownTime"
          );
          const lastAdShownTime = lastAdShownString
            ? parseInt(lastAdShownString, 10)
            : 0;
          const now = Date.now();

          if (now - lastAdShownTime > AD_INTERVAL_MS) {
            try {
              await showAppOpenAd();
              await AsyncStorage.setItem("lastAdShownTime", now.toString());
            } catch (e) {
              console.log("AppOpenAd error", e);
            }
          }
        }

        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const handleGlobalPress = async () => {
    const lastAdShownString = await AsyncStorage.getItem("lastAdShownTime");
    const lastAdShownTime = lastAdShownString
      ? parseInt(lastAdShownString, 10)
      : 0;
    const now = Date.now();

    if (now - lastAdShownTime > AD_INTERVAL_MS) {
      try {
        await showInterstitial();
        await AsyncStorage.setItem("lastAdShownTime", now.toString());
      } catch (error) {
        console.error("Error showing interstitial ad:", error);
      }
    }
  };

  return { handleGlobalPress };
}

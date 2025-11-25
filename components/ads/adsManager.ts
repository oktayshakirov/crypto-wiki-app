import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  showInterstitial,
  reloadInterstitial,
  waitForInterstitialLoad,
  isInterstitialLoaded,
} from "./InterstitialAd";
import {
  showAppOpenAd,
  reloadAppOpenAd,
  waitForAppOpenAdLoad,
  getAppOpenAdLoaded,
} from "./AppOpenAd";

const AD_INTERVAL_MS = 60000;
const LAST_AD_SHOWN_TIME_KEY = "lastAdShownTime";

async function getLastAdShownTime(): Promise<number> {
  try {
    const lastAdShownString = await AsyncStorage.getItem(
      LAST_AD_SHOWN_TIME_KEY
    );
    return lastAdShownString ? parseInt(lastAdShownString, 10) : 0;
  } catch (error) {
    console.error("Failed to get last ad shown time:", error);
    return 0;
  }
}

async function setLastAdShownTime(): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_AD_SHOWN_TIME_KEY, Date.now().toString());
  } catch (error) {
    console.error("Failed to set last ad shown time:", error);
  }
}

function shouldShowAd(lastAdShownTime: number): boolean {
  return Date.now() - lastAdShownTime > AD_INTERVAL_MS;
}

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
          // Reload ads if they're not loaded
          try {
            if (!isInterstitialLoaded()) {
              await reloadInterstitial();
            } else {
              await waitForInterstitialLoad();
            }
            if (!getAppOpenAdLoaded()) {
              await reloadAppOpenAd();
            } else {
              await waitForAppOpenAdLoad();
            }
          } catch (error) {
            console.error("Failed to reload ads on foreground:", error);
          }

          // Show app open ad if enough time has passed
          try {
            const lastAdShownTime = await getLastAdShownTime();
            if (shouldShowAd(lastAdShownTime)) {
              const ready =
                getAppOpenAdLoaded() ||
                (await reloadAppOpenAd()) ||
                (await waitForAppOpenAdLoad());

              if (ready && getAppOpenAdLoaded()) {
                await showAppOpenAd();
                await setLastAdShownTime();
              }
            }
          } catch (error) {
            console.error("Failed to show app open ad on foreground:", error);
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
    try {
      const lastAdShownTime = await getLastAdShownTime();
      if (shouldShowAd(lastAdShownTime)) {
        const ready =
          isInterstitialLoaded() ||
          (await reloadInterstitial()) ||
          (await waitForInterstitialLoad());

        if (ready && isInterstitialLoaded()) {
          await showInterstitial();
          await setLastAdShownTime();
        }
      }
    } catch (error) {
      console.error("Failed to show interstitial ad:", error);
    }
  };

  return { handleGlobalPress };
}

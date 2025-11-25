import { AppOpenAd, AdEventType } from "react-native-google-mobile-ads";
import { getAdUnitId } from "./adConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

let appOpenAd: AppOpenAd | null = null;
let isAppOpenAdLoaded = false;
let isShowingAd = false;
let eventListeners: Array<() => void> = [];
let loadResolvers: Array<(success: boolean) => void> = [];

function notifyLoadResolvers(success: boolean) {
  loadResolvers.forEach((resolve) => resolve(success));
  loadResolvers = [];
}

function cleanupAppOpenAd() {
  if (appOpenAd) {
    // Remove all event listeners
    eventListeners.forEach((remove) => remove());
    eventListeners = [];
    appOpenAd = null;
  }
  isAppOpenAdLoaded = false;
  isShowingAd = false;
}

export async function loadAppOpenAd() {
  try {
    // Clean up existing ad instance if any
    cleanupAppOpenAd();

    const consent = await AsyncStorage.getItem("trackingConsent");
    const requestNonPersonalizedAdsOnly = consent !== "granted";

    appOpenAd = AppOpenAd.createForAdRequest(getAdUnitId("appOpen")!, {
      requestNonPersonalizedAdsOnly,
    });

    const removeLoaded = appOpenAd.addAdEventListener(
      AdEventType.LOADED,
      () => {
        isAppOpenAdLoaded = true;
        notifyLoadResolvers(true);
      }
    );
    eventListeners.push(removeLoaded);

    const removeError = appOpenAd.addAdEventListener(AdEventType.ERROR, () => {
      isAppOpenAdLoaded = false;
      notifyLoadResolvers(false);
    });
    eventListeners.push(removeError);

    const removeClosed = appOpenAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        isShowingAd = false;
        isAppOpenAdLoaded = false;
        appOpenAd?.load();
      }
    );
    eventListeners.push(removeClosed);

    appOpenAd.load();
    await waitForAppOpenAdLoad();
  } catch (error) {
    console.error("Failed to load app open ad:", error);
    isAppOpenAdLoaded = false;
  }
}

export function getAppOpenAdLoaded(): boolean {
  return isAppOpenAdLoaded && appOpenAd !== null;
}

export async function reloadAppOpenAd(): Promise<boolean> {
  if (!isAppOpenAdLoaded) {
    try {
      if (appOpenAd) {
        await appOpenAd.load();
        return waitForAppOpenAdLoad();
      } else {
        await loadAppOpenAd();
        return true;
      }
    } catch (error) {
      console.error("Failed to reload app open ad:", error);
    }
  }
  return isAppOpenAdLoaded;
}

export async function showAppOpenAd() {
  if (appOpenAd && isAppOpenAdLoaded && !isShowingAd) {
    try {
      isShowingAd = true;
      await appOpenAd.show();
    } catch (error) {
      console.error("Failed to show app open ad:", error);
      isShowingAd = false;
    }
  }
}

export function waitForAppOpenAdLoad(timeoutMs = 5000): Promise<boolean> {
  if (isAppOpenAdLoaded) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      notifyLoadResolvers(false);
    }, timeoutMs);

    loadResolvers.push((success) => {
      clearTimeout(timeout);
      resolve(success);
    });
  });
}

export default null;

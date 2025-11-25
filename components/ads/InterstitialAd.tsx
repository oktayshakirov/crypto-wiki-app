import { InterstitialAd, AdEventType } from "react-native-google-mobile-ads";
import { getAdUnitId } from "./adConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

let interstitial: InterstitialAd | null = null;
let isAdLoaded = false;
let eventListeners: Array<() => void> = [];
let loadResolvers: Array<(success: boolean) => void> = [];

function notifyLoadResolvers(success: boolean) {
  loadResolvers.forEach((resolve) => resolve(success));
  loadResolvers = [];
}

function cleanupInterstitial() {
  if (interstitial) {
    // Remove all event listeners
    eventListeners.forEach((remove) => remove());
    eventListeners = [];
    interstitial = null;
  }
  isAdLoaded = false;
}

export async function initializeInterstitial() {
  try {
    // Clean up existing ad instance if any
    cleanupInterstitial();

    const consent = await AsyncStorage.getItem("trackingConsent");
    const requestNonPersonalizedAdsOnly = consent !== "granted";

    interstitial = InterstitialAd.createForAdRequest(
      getAdUnitId("interstitial")!,
      {
        requestNonPersonalizedAdsOnly,
      }
    );

    const removeLoaded = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        isAdLoaded = true;
        notifyLoadResolvers(true);
      }
    );
    eventListeners.push(removeLoaded);

    const removeError = interstitial.addAdEventListener(
      AdEventType.ERROR,
      () => {
        isAdLoaded = false;
        notifyLoadResolvers(false);
      }
    );
    eventListeners.push(removeError);

    const removeClosed = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        isAdLoaded = false;
        interstitial?.load();
      }
    );
    eventListeners.push(removeClosed);

    await interstitial.load();
    await waitForInterstitialLoad();
  } catch (error) {
    console.error("Failed to initialize interstitial ad:", error);
    isAdLoaded = false;
  }
}

export function isInterstitialLoaded(): boolean {
  return isAdLoaded && interstitial !== null;
}

export async function reloadInterstitial(): Promise<boolean> {
  if (!isAdLoaded) {
    try {
      if (interstitial) {
        await interstitial.load();
        return waitForInterstitialLoad();
      } else {
        await initializeInterstitial();
        return true;
      }
    } catch (error) {
      console.error("Failed to reload interstitial ad:", error);
    }
  }
  return isAdLoaded;
}

export async function showInterstitial() {
  if (interstitial && isAdLoaded) {
    interstitial.show();
    isAdLoaded = false;
  }
}

export function waitForInterstitialLoad(timeoutMs = 5000): Promise<boolean> {
  if (isAdLoaded) {
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

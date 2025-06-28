import { Platform } from "react-native";
import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from "react-native-google-mobile-ads";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  incrementAdLoadAttempts,
  resetAdLoadAttempts,
  canRetryAdLoad,
} from "@/utils/adUtils";

const USE_TEST_ADS = true;

const productionAdUnitIDs = Platform.select({
  ios: "ca-app-pub-5852582960793521/7564116438",
  android: "ca-app-pub-5852582960793521/2816569678",
});

const testAdUnitID = TestIds.INTERSTITIAL;
const adUnitID = USE_TEST_ADS ? testAdUnitID : productionAdUnitIDs;

let interstitial: InterstitialAd | null = null;
let isAdLoaded = false;
let isLoading = false;
let unsubscribeLoaded: (() => void) | null = null;
let unsubscribeError: (() => void) | null = null;
let unsubscribeClosed: (() => void) | null = null;

function cleanupEventListeners() {
  if (unsubscribeLoaded) {
    unsubscribeLoaded();
    unsubscribeLoaded = null;
  }
  if (unsubscribeError) {
    unsubscribeError();
    unsubscribeError = null;
  }
  if (unsubscribeClosed) {
    unsubscribeClosed();
    unsubscribeClosed = null;
  }
}

export async function initializeInterstitial() {
  try {
    cleanupEventListeners();

    const consent = await AsyncStorage.getItem("trackingConsent");
    const requestNonPersonalizedAdsOnly = consent === "granted" ? false : true;

    interstitial = InterstitialAd.createForAdRequest(adUnitID!, {
      requestNonPersonalizedAdsOnly,
    });

    unsubscribeLoaded = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        isAdLoaded = true;
        isLoading = false;
        resetAdLoadAttempts();
        console.log("Interstitial ad loaded successfully");
      }
    );

    unsubscribeError = interstitial.addAdEventListener(
      AdEventType.ERROR,
      (error: Error) => {
        isAdLoaded = false;
        isLoading = false;
        incrementAdLoadAttempts();

        if (canRetryAdLoad()) {
          setTimeout(() => {
            if (!isLoading && !isAdLoaded) {
              loadInterstitial();
            }
          }, 5000);
        }
      }
    );

    unsubscribeClosed = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        isAdLoaded = false;
        setTimeout(() => {
          loadInterstitial();
        }, 1000);
      }
    );

    await loadInterstitial();
  } catch (error) {
    console.error("Failed to initialize interstitial:", error);
  }
}

async function loadInterstitial() {
  if (!interstitial || isLoading || isAdLoaded) {
    return;
  }

  try {
    isLoading = true;
    await interstitial.load();
  } catch (error) {
    isLoading = false;
    console.error("Failed to load interstitial:", error);
  }
}

export async function showInterstitial(): Promise<boolean> {
  if (!interstitial || !isAdLoaded) {
    return false;
  }

  return new Promise<boolean>((resolve) => {
    try {
      interstitial!.show();
      isAdLoaded = false;
      resolve(true);
    } catch (error) {
      console.error("Failed to show interstitial:", error);
      resolve(false);
    }
  });
}

export function isInterstitialReady(): boolean {
  return isAdLoaded && !isLoading;
}

export async function reloadInterstitial() {
  isAdLoaded = false;
  isLoading = false;
  resetAdLoadAttempts();
  await loadInterstitial();
}

export function cleanupInterstitial() {
  cleanupEventListeners();
  interstitial = null;
  isAdLoaded = false;
  isLoading = false;
}

export default null;

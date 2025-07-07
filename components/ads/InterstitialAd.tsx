import { InterstitialAd, AdEventType } from "react-native-google-mobile-ads";
import { getAdUnitId } from "./adConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

let interstitial: InterstitialAd | null = null;
let isAdLoaded = false;

export async function initializeInterstitial() {
  const consent = await AsyncStorage.getItem("trackingConsent");
  const requestNonPersonalizedAdsOnly = consent !== "granted";

  interstitial = InterstitialAd.createForAdRequest(
    getAdUnitId("interstitial")!,
    {
      requestNonPersonalizedAdsOnly,
    }
  );

  interstitial.addAdEventListener(AdEventType.LOADED, () => {
    isAdLoaded = true;
    console.log("Interstitial ad loaded");
  });

  interstitial.addAdEventListener(AdEventType.ERROR, (error: Error) => {
    isAdLoaded = false;
    console.error("Interstitial ad failed to load:", error);
  });

  await interstitial.load();
}

export async function showInterstitial() {
  if (interstitial && isAdLoaded) {
    interstitial.show();
    isAdLoaded = false;
  }
}

export default null;

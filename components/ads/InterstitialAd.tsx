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
  });

  interstitial.addAdEventListener(AdEventType.ERROR, () => {
    isAdLoaded = false;
  });

  interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    isAdLoaded = false;
    interstitial!.load();
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

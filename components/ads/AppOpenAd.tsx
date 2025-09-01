import { AppOpenAd, AdEventType } from "react-native-google-mobile-ads";
import { getAdUnitId } from "./adConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

let appOpenAd: AppOpenAd | null = null;
let isAppOpenAdLoaded = false;
let isShowingAd = false;

export async function loadAppOpenAd() {
  const consent = await AsyncStorage.getItem("trackingConsent");
  const requestNonPersonalizedAdsOnly = consent !== "granted";

  appOpenAd = AppOpenAd.createForAdRequest(getAdUnitId("appOpen")!, {
    requestNonPersonalizedAdsOnly,
  });

  appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
    isAppOpenAdLoaded = true;
  });

  appOpenAd.addAdEventListener(AdEventType.ERROR, () => {
    isAppOpenAdLoaded = false;
  });

  appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
    isShowingAd = false;
    isAppOpenAdLoaded = false;
    appOpenAd?.load();
  });

  appOpenAd.load();
}

export async function showAppOpenAd() {
  if (appOpenAd && isAppOpenAdLoaded && !isShowingAd) {
    try {
      isShowingAd = true;
      await appOpenAd.show();
    } catch {
      isShowingAd = false;
    }
  }
}

export default null;

import { AppOpenAd, AdEventType } from "react-native-google-mobile-ads";
import { getAdUnitId } from "./adConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

let appOpenAd: AppOpenAd | null = null;

export async function showAppOpenAd() {
  const consent = await AsyncStorage.getItem("trackingConsent");
  const requestNonPersonalizedAdsOnly = consent !== "granted";

  appOpenAd = AppOpenAd.createForAdRequest(getAdUnitId("appOpen")!, {
    requestNonPersonalizedAdsOnly,
  });

  return new Promise<void>((resolve, reject) => {
    const unsubscribeLoaded = appOpenAd!.addAdEventListener(
      AdEventType.LOADED,
      () => {
        appOpenAd!.show();
      }
    );
    const unsubscribeError = appOpenAd!.addAdEventListener(
      AdEventType.ERROR,
      (error: Error) => {
        unsubscribeLoaded();
        unsubscribeError();
        unsubscribeClosed();
        reject(error);
      }
    );
    const unsubscribeClosed = appOpenAd!.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        unsubscribeLoaded();
        unsubscribeError();
        unsubscribeClosed();
        resolve();
      }
    );
    appOpenAd!.load();
  });
}

export default null;

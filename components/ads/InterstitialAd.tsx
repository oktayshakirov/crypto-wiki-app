import { Platform } from "react-native";
import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from "react-native-google-mobile-ads";
import AsyncStorage from "@react-native-async-storage/async-storage";

const USE_TEST_ADS = false;

const productionAdUnitIDs = Platform.select({
  ios: "ca-app-pub-5852582960793521/7564116438",
  android: "ca-app-pub-5852582960793521/2816569678",
});

const testAdUnitID = TestIds.INTERSTITIAL;
const adUnitID = USE_TEST_ADS ? testAdUnitID : productionAdUnitIDs;

let interstitial = InterstitialAd.createForAdRequest(adUnitID!, {
  requestNonPersonalizedAdsOnly: true,
});

export async function showInterstitial() {
  const consent = await AsyncStorage.getItem("trackingConsent");
  const requestNonPersonalizedAdsOnly = consent === "granted" ? false : true;

  interstitial = InterstitialAd.createForAdRequest(adUnitID!, {
    requestNonPersonalizedAdsOnly,
  });

  return new Promise<void>((resolve, reject) => {
    const unsubscribeLoaded = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        interstitial.show();
      }
    );
    const unsubscribeError = interstitial.addAdEventListener(
      AdEventType.ERROR,
      (error: Error) => {
        unsubscribeLoaded();
        unsubscribeError();
        reject(error);
      }
    );
    const unsubscribeClosed = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        unsubscribeLoaded();
        unsubscribeError();
        resolve();
      }
    );
    interstitial.load();
  });
}

export default null;

import { Platform } from "react-native";
import {
  AppOpenAd,
  AdEventType,
  TestIds,
} from "react-native-google-mobile-ads";
import AsyncStorage from "@react-native-async-storage/async-storage";

const USE_TEST_ADS = true;

const productionAdUnitIDs = Platform.select({
  ios: "ca-app-pub-5852582960793521/6510055062",
  android: "ca-app-pub-5852582960793521/4746381400",
});

const testAdUnitID = TestIds.APP_OPEN;
const adUnitID = USE_TEST_ADS ? testAdUnitID : productionAdUnitIDs;

let appOpenAd = AppOpenAd.createForAdRequest(adUnitID!, {
  requestNonPersonalizedAdsOnly: true,
});

export async function showAppOpenAd() {
  const consent = await AsyncStorage.getItem("trackingConsent");
  const requestNonPersonalizedAdsOnly = consent === "granted" ? false : true;

  appOpenAd = AppOpenAd.createForAdRequest(adUnitID!, {
    requestNonPersonalizedAdsOnly,
  });

  return new Promise<void>((resolve, reject) => {
    const unsubscribeLoaded = appOpenAd.addAdEventListener(
      AdEventType.LOADED,
      () => {
        appOpenAd.show();
      }
    );
    const unsubscribeError = appOpenAd.addAdEventListener(
      AdEventType.ERROR,
      (error: Error) => {
        unsubscribeLoaded();
        unsubscribeError();
        unsubscribeClosed();
        reject(error);
      }
    );
    const unsubscribeClosed = appOpenAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        unsubscribeLoaded();
        unsubscribeError();
        unsubscribeClosed();
        resolve();
      }
    );
    appOpenAd.load();
  });
}

export default null;

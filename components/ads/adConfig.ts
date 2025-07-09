import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

export const USE_TEST_ADS = false;

export const adUnitIDs = {
  banner: Platform.select({
    ios: "ca-app-pub-5852582960793521/3679843833",
    android: "ca-app-pub-5852582960793521/8692497364",
  }),
  interstitial: Platform.select({
    ios: "ca-app-pub-5852582960793521/7564116438",
    android: "ca-app-pub-5852582960793521/2816569678",
  }),
  appOpen: Platform.select({
    ios: "ca-app-pub-5852582960793521/6510055062",
    android: "ca-app-pub-5852582960793521/4746381400",
  }),
};

export const testAdUnitIDs = {
  banner: TestIds.BANNER,
  interstitial: TestIds.INTERSTITIAL,
  appOpen: TestIds.APP_OPEN,
};

type AdType = "banner" | "interstitial" | "appOpen";

export function getAdUnitId(type: AdType): string | undefined {
  return USE_TEST_ADS ? testAdUnitIDs[type] : adUnitIDs[type];
}

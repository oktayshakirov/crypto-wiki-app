import { AppOpenAd, AdEventType } from "react-native-google-mobile-ads";
import { getAdUnitId } from "./adConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

let appOpenAd: AppOpenAd | null = null;
let isAppOpenAdLoaded = false;
let isShowingAd = false;
let initializingPromise: Promise<void> | null = null;
let appOpenListeners: Array<() => void> = [];

function detachListeners() {
  appOpenListeners.forEach((unsubscribe) => unsubscribe());
  appOpenListeners = [];
}

async function createAppOpenInstance() {
  const consent = await AsyncStorage.getItem("trackingConsent");
  const requestNonPersonalizedAdsOnly = consent !== "granted";

  const ad = AppOpenAd.createForAdRequest(getAdUnitId("appOpen")!, {
    requestNonPersonalizedAdsOnly,
  });

  detachListeners();
  appOpenListeners.push(
    ad.addAdEventListener(AdEventType.LOADED, () => {
      isAppOpenAdLoaded = true;
    })
  );
  appOpenListeners.push(
    ad.addAdEventListener(AdEventType.ERROR, () => {
      isAppOpenAdLoaded = false;
    })
  );
  appOpenListeners.push(
    ad.addAdEventListener(AdEventType.CLOSED, () => {
      isShowingAd = false;
      isAppOpenAdLoaded = false;
      ad.load();
    })
  );

  return ad;
}

export async function loadAppOpenAd(force = false) {
  if (initializingPromise && !force) {
    return initializingPromise;
  }

  initializingPromise = (async () => {
    appOpenAd = await createAppOpenInstance();
    await appOpenAd.load();
  })();

  try {
    await initializingPromise;
  } finally {
    initializingPromise = null;
  }
}

export async function ensureAppOpenAdLoaded() {
  if (!appOpenAd) {
    await loadAppOpenAd();
    return;
  }

  if (!isAppOpenAdLoaded && !isShowingAd) {
    try {
      await appOpenAd.load();
    } catch {
      await loadAppOpenAd(true);
    }
  }
}

export function isAppOpenAdReady() {
  return isAppOpenAdLoaded && !isShowingAd;
}

export async function showAppOpenAd() {
  if (!appOpenAd || !isAppOpenAdLoaded || isShowingAd) {
    await ensureAppOpenAdLoaded();
  }

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

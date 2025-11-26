import { InterstitialAd, AdEventType } from "react-native-google-mobile-ads";
import { getAdUnitId } from "./adConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

let interstitial: InterstitialAd | null = null;
let isAdLoaded = false;
let initializingPromise: Promise<void> | null = null;
let interstitialListeners: Array<() => void> = [];

function detachListeners() {
  interstitialListeners.forEach((unsubscribe) => unsubscribe());
  interstitialListeners = [];
}

async function createInterstitialInstance() {
  const consent = await AsyncStorage.getItem("trackingConsent");
  const requestNonPersonalizedAdsOnly = consent !== "granted";

  const ad = InterstitialAd.createForAdRequest(getAdUnitId("interstitial")!, {
    requestNonPersonalizedAdsOnly,
  });

  detachListeners();
  interstitialListeners.push(
    ad.addAdEventListener(AdEventType.LOADED, () => {
      isAdLoaded = true;
    })
  );
  interstitialListeners.push(
    ad.addAdEventListener(AdEventType.ERROR, () => {
      isAdLoaded = false;
    })
  );
  interstitialListeners.push(
    ad.addAdEventListener(AdEventType.CLOSED, () => {
      isAdLoaded = false;
      ad.load();
    })
  );

  return ad;
}

export async function initializeInterstitial(force = false) {
  if (initializingPromise && !force) {
    return initializingPromise;
  }

  initializingPromise = (async () => {
    interstitial = await createInterstitialInstance();
    await interstitial.load();
  })();

  try {
    await initializingPromise;
  } finally {
    initializingPromise = null;
  }
}

export async function ensureInterstitialLoaded() {
  if (!interstitial) {
    await initializeInterstitial();
    return;
  }

  if (!isAdLoaded) {
    try {
      await interstitial.load();
    } catch {
      await initializeInterstitial(true);
    }
  }
}

export function isInterstitialReady() {
  return isAdLoaded;
}

export async function showInterstitial() {
  if (!interstitial || !isAdLoaded) {
    await ensureInterstitialLoaded();
  }

  if (interstitial && isAdLoaded) {
    interstitial.show();
    isAdLoaded = false;
  }
}

export default null;

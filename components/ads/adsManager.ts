import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showInterstitial, ensureInterstitialLoaded } from "./InterstitialAd";
import { showAppOpenAd, ensureAppOpenAdLoaded } from "./AppOpenAd";
import { useRevenueCat } from "@/contexts/RevenueCatContext";
import { useOnboarding } from "@/contexts/OnboardingContext";

const AD_INTERVAL_MS = 60000;

// No ad (app-open or interstitial) may show within this long of the JS bundle
// starting up. Covers cold launch, plus the inactive->active blips caused by
// system permission dialogs (ATT, notifications) firing right after launch —
// without this, those blips satisfy the AD_INTERVAL_MS cooldown immediately
// and an ad can appear before the user has done anything.
const LAUNCH_GRACE_PERIOD_MS = 20000;
const appLaunchTime = Date.now();

// A backgrounded app counts as a new "session" for paywall pacing only after
// this long away — brief app-switcher glances shouldn't inflate the count.
const MIN_BACKGROUND_FOR_NEW_SESSION_MS = 30 * 60 * 1000;

const SESSION_COUNT_KEY = "@app/sessionCount";
const AUTO_PAYWALL_SHOW_COUNT_KEY = "@app/paywallAutoShowCount";
// Don't auto-show the paywall on day one — let the user get some value first.
const FIRST_AUTO_PAYWALL_SESSION = 3;
// Stop auto-showing after this many times so non-converters aren't nagged
// into a bad review or an uninstall; "Upgrade to Pro" stays in the menu.
const MAX_AUTO_PAYWALL_SHOWS = 3;
const POST_AD_PAYWALL_DELAY_MS = 400;

async function getAutoPaywallShowCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(AUTO_PAYWALL_SHOW_COUNT_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

async function canAutoShowPaywall(): Promise<boolean> {
  return (await getAutoPaywallShowCount()) < MAX_AUTO_PAYWALL_SHOWS;
}

async function recordAutoPaywallShow(): Promise<void> {
  const count = await getAutoPaywallShowCount();
  await AsyncStorage.setItem(AUTO_PAYWALL_SHOW_COUNT_KEY, (count + 1).toString());
}

export function initializeGlobalAds() {}

export function useGlobalAds() {
  const { isPro, isReady, showPaywall } = useRevenueCat();
  const appState = useRef(AppState.currentState);
  const lastBackgroundTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isPro || !isReady) {
      return;
    }
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        const currentState = appState.current;

        if (
          currentState === "active" &&
          nextAppState.match(/inactive|background/)
        ) {
          lastBackgroundTimeRef.current = Date.now();
        }

        if (
          currentState.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          const now = Date.now();
          const backgroundTime =
            lastBackgroundTimeRef.current > 0
              ? now - lastBackgroundTimeRef.current
              : 0;

          try {
            await Promise.all([
              ensureInterstitialLoaded(backgroundTime),
              ensureAppOpenAdLoaded(backgroundTime),
            ]);
          } catch {
            // Ignore ensure errors, will retry next time
          }

          const lastAdShownString = await AsyncStorage.getItem(
            "lastAdShownTime"
          );
          const lastAdShownTime = lastAdShownString
            ? parseInt(lastAdShownString, 10)
            : 0;

          if (
            now - appLaunchTime > LAUNCH_GRACE_PERIOD_MS &&
            now - lastAdShownTime > AD_INTERVAL_MS
          ) {
            try {
              await showAppOpenAd();
              await AsyncStorage.setItem("lastAdShownTime", now.toString());
            } catch {
              // Ignore show errors
            }
          }
        }

        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [isPro, isReady]);

  const handleGlobalPress = async () => {
    if (isPro || !isReady) {
      return;
    }
    const lastAdShownString = await AsyncStorage.getItem("lastAdShownTime");
    const lastAdShownTime = lastAdShownString
      ? parseInt(lastAdShownString, 10)
      : 0;
    const now = Date.now();

    if (
      now - appLaunchTime > LAUNCH_GRACE_PERIOD_MS &&
      now - lastAdShownTime > AD_INTERVAL_MS
    ) {
      try {
        await ensureInterstitialLoaded();
        await showInterstitial(() => {
          // Fires only if an ad actually showed — ad fatigue is freshest here.
          (async () => {
            if (isPro || !(await canAutoShowPaywall())) return;
            await new Promise((r) => setTimeout(r, POST_AD_PAYWALL_DELAY_MS));
            if (isPro) return;
            await recordAutoPaywallShow();
            await showPaywall();
          })().catch(() => {});
        });
        await AsyncStorage.setItem("lastAdShownTime", now.toString());
      } catch {}
    }
  };

  return { handleGlobalPress };
}

let appOpenHandled = false;

/**
 * Tracks app-open "sessions" (cold starts, plus resumes after a real break)
 * and auto-presents the paywall once, on the Nth session, so new users get
 * to use the app before being asked to pay. Mount this once at the app root.
 */
export function useAppOpenPaywallTracking() {
  const { isPro, isReady, showPaywall } = useRevenueCat();
  const { isOnboardingActive } = useOnboarding();
  const isProRef = useRef(isPro);
  const isReadyRef = useRef(isReady);
  const showPaywallRef = useRef(showPaywall);
  const isOnboardingActiveRef = useRef(isOnboardingActive);
  isProRef.current = isPro;
  isReadyRef.current = isReady;
  showPaywallRef.current = showPaywall;
  isOnboardingActiveRef.current = isOnboardingActive;
  const appState = useRef(AppState.currentState);
  const lastBackgroundTimeRef = useRef<number>(0);

  const handleAppOpen = async () => {
    const raw = await AsyncStorage.getItem(SESSION_COUNT_KEY);
    const sessionCount = (raw ? parseInt(raw, 10) : 0) + 1;
    await AsyncStorage.setItem(SESSION_COUNT_KEY, sessionCount.toString());

    if (sessionCount !== FIRST_AUTO_PAYWALL_SESSION) return;
    if (!(await canAutoShowPaywall())) return;

    const deadline = Date.now() + 8000;
    while (
      (!isReadyRef.current || isOnboardingActiveRef.current) &&
      Date.now() < deadline
    ) {
      await new Promise((r) => setTimeout(r, 200));
    }
    if (isProRef.current || !isReadyRef.current || isOnboardingActiveRef.current)
      return;

    // Let the UI settle before presenting the paywall.
    await new Promise((r) => setTimeout(r, 1500));
    if (isProRef.current) return;

    await recordAutoPaywallShow();
    await showPaywallRef.current();
  };

  useEffect(() => {
    if (appOpenHandled) return;
    appOpenHandled = true;
    handleAppOpen().catch(() => {});
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      const currentState = appState.current;

      if (
        currentState === "active" &&
        nextAppState.match(/inactive|background/)
      ) {
        lastBackgroundTimeRef.current = Date.now();
      }

      if (
        currentState.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        const awayFor =
          lastBackgroundTimeRef.current > 0
            ? Date.now() - lastBackgroundTimeRef.current
            : 0;
        if (awayFor >= MIN_BACKGROUND_FOR_NEW_SESSION_MS) {
          handleAppOpen().catch(() => {});
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);
}

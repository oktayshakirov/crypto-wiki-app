// Ad frequency capping utilities
const INTERSTITIAL_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
let lastInterstitialTime = 0;

export function canShowInterstitial(): boolean {
  const now = Date.now();
  return now - lastInterstitialTime >= INTERSTITIAL_INTERVAL_MS;
}

export function markInterstitialShown(): void {
  lastInterstitialTime = Date.now();
}

export function getTimeUntilNextInterstitial(): number {
  const now = Date.now();
  const timeSinceLastAd = now - lastInterstitialTime;
  return Math.max(0, INTERSTITIAL_INTERVAL_MS - timeSinceLastAd);
}

let adLoadAttempts = 0;
const MAX_LOAD_ATTEMPTS = 3;

export function incrementAdLoadAttempts(): void {
  adLoadAttempts++;
}

export function resetAdLoadAttempts(): void {
  adLoadAttempts = 0;
}

export function canRetryAdLoad(): boolean {
  return adLoadAttempts < MAX_LOAD_ATTEMPTS;
}

export function getAdLoadAttempts(): number {
  return adLoadAttempts;
}

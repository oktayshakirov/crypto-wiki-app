import React, { useEffect, useRef } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useLoader } from "@/contexts/LoaderContext";
import OnboardingScreen from "./OnboardingScreen";
import { useRevenueCat } from "@/contexts/RevenueCatContext";

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

export default function OnboardingWrapper({
  children,
}: OnboardingWrapperProps) {
  const { isOnboardingActive, isLoading } = useOnboarding();
  const { hideLoader } = useLoader();
  const { isPro, isReady, showPaywall } = useRevenueCat();
  const previousOnboardingActive = useRef(isOnboardingActive);
  const paywallHandledAfterOnboarding = useRef(false);

  useEffect(() => {
    if (isOnboardingActive || isLoading) {
      hideLoader();
    }
  }, [isOnboardingActive, isLoading, hideLoader]);

  useEffect(() => {
    const wasOnboardingActive = previousOnboardingActive.current;
    const onboardingJustFinished = wasOnboardingActive && !isOnboardingActive;

    if (
      onboardingJustFinished &&
      !paywallHandledAfterOnboarding.current &&
      isReady &&
      !isPro
    ) {
      paywallHandledAfterOnboarding.current = true;
      showPaywall().catch(() => {});
    }

    previousOnboardingActive.current = isOnboardingActive;
  }, [isOnboardingActive, isReady, isPro, showPaywall]);

  if (isLoading) {
    return <OnboardingScreen />;
  }

  return (
    <>
      {children}
      {isOnboardingActive && <OnboardingScreen />}
    </>
  );
}

import React, { useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useLoader } from "@/contexts/LoaderContext";
import OnboardingScreen from "./OnboardingScreen";

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

export default function OnboardingWrapper({
  children,
}: OnboardingWrapperProps) {
  const { isOnboardingActive, isLoading } = useOnboarding();
  const { hideLoader } = useLoader();

  useEffect(() => {
    if (isOnboardingActive || isLoading) {
      hideLoader();
    }
  }, [isOnboardingActive, isLoading, hideLoader]);

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

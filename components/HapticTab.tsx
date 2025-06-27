import React from "react";
import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import { useRefresh } from "@/contexts/RefreshContext";
import { showInterstitial } from "@/components/ads/InterstitialAd";

interface HapticTabProps extends BottomTabBarButtonProps {
  refreshKey: string;
}

// Frequency capping: only show an interstitial every 2 minutes
const INTERSTITIAL_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
let lastInterstitialTime = 0;

export function HapticTab(props: HapticTabProps) {
  const { refreshKey, ...rest } = props;
  const { triggerRefresh } = useRefresh(refreshKey);

  const handlePress = async (ev: any) => {
    if (props.accessibilityState?.selected) {
      triggerRefresh();
    } else {
      const now = Date.now();
      if (now - lastInterstitialTime >= INTERSTITIAL_INTERVAL_MS) {
        try {
          await showInterstitial();
          lastInterstitialTime = Date.now();
        } catch (e) {}
      }
      props.onPress?.(ev);
    }
  };

  return (
    <PlatformPressable
      {...rest}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
      onPress={handlePress}
    />
  );
}

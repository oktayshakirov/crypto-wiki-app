import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Animated, AppState } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { getAdUnitId } from "./adConfig";
import { useAdConsent } from "./useAdConsent";
import { useRevenueCat } from "@/contexts/RevenueCatContext";

const BannerAdComponent = () => {
  const { requestNonPersonalizedAdsOnly } = useAdConsent();
  const { isPro, isReady } = useRevenueCat();
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [adKey, setAdKey] = useState(0);
  const appState = useRef(AppState.currentState);

  const handleAdLoaded = () => {
    setIsAdLoaded(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleAdFailedToLoad = () => {
    setIsAdLoaded(false);
  };

  useEffect(() => {
    if (isPro || !isReady) return;
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        setIsAdLoaded(false);
        setAdKey((prev) => prev + 1);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isPro, isReady]);

  if (isPro || !isReady) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.bannerContainer,
        {
          opacity: fadeAnim,
          height: isAdLoaded ? "auto" : 0,
          overflow: "hidden",
        },
      ]}
    >
      <BannerAd
        key={adKey}
        unitId={getAdUnitId("banner")!}
        size={BannerAdSize.ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly,
        }}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleAdFailedToLoad}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    width: "100%",
    alignItems: "center",
  },
});

export default BannerAdComponent;

import React, { useState } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { getAdUnitId } from "./adConfig";
import { useAdConsent } from "./useAdConsent";

const BannerAdComponent = () => {
  const { requestNonPersonalizedAdsOnly } = useAdConsent();
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

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

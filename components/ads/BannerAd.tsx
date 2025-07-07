import React from "react";
import { View, StyleSheet } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { getAdUnitId } from "./adConfig";
import { useAdConsent } from "./useAdConsent";

const BannerAdComponent = () => {
  const { requestNonPersonalizedAdsOnly } = useAdConsent();

  return (
    <View style={styles.bannerContainer}>
      <BannerAd
        unitId={getAdUnitId("banner")!}
        size={BannerAdSize.ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly,
        }}
        onAdLoaded={() => console.log("Banner ad loaded!")}
        onAdFailedToLoad={(error) =>
          console.error("Banner ad failed to load:", error)
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    width: "100%",
    alignItems: "center",
  },
});

export default BannerAdComponent;

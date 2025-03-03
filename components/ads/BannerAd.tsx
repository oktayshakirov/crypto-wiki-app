import React, { useEffect, useState } from "react";
import { Platform, View, StyleSheet } from "react-native";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";
import AsyncStorage from "@react-native-async-storage/async-storage";

const USE_TEST_ADS = false;

const productionAdUnitIDs = Platform.select({
  ios: "ca-app-pub-5852582960793521/3679843833",
  android: "ca-app-pub-5852582960793521/8692497364",
})!;

const testAdUnitID = TestIds.BANNER;
const adUnitID: string = USE_TEST_ADS ? testAdUnitID : productionAdUnitIDs;

const BannerAdComponent = () => {
  const [consent, setConsent] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("trackingConsent").then((storedConsent) => {
      setConsent(storedConsent);
    });
  }, []);

  const requestNonPersonalizedAdsOnly = consent === "granted" ? false : true;

  return (
    <View style={styles.bannerContainer}>
      <BannerAd
        unitId={adUnitID}
        size={BannerAdSize.ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: requestNonPersonalizedAdsOnly,
        }}
        onAdLoaded={() => console.log("Ad loaded!")}
        onAdFailedToLoad={(error) => console.error("Ad failed to load:", error)}
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

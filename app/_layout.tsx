import { Slot } from "expo-router";
import { RefreshProvider } from "@/contexts/RefreshContext";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  Platform,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import * as Notifications from "expo-notifications";
import { EventSubscription } from "expo-modules-core";
import BannerAd from "@/components/ads/BannerAd";
import { Colors } from "@/constants/Colors";
import ConsentDialog from "@/components/ads/ConsentDialog";
import initialize from "react-native-google-mobile-ads";
import { LoaderProvider } from "@/contexts/LoaderContext";
import { getOrRegisterPushToken } from "@/utils/pushToken";
import { initializeInterstitial } from "@/components/ads/InterstitialAd";
import { loadAppOpenAd } from "@/components/ads/AppOpenAd";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [consentCompleted, setConsentCompleted] = useState(false);
  const notificationListener = useRef<EventSubscription | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);

  useEffect(() => {
    const adapterStatuses = initialize();
    console.log("Ads initialized:", adapterStatuses);

    // Initialize interstitial and app open ads ONCE
    initializeInterstitial();
    loadAppOpenAd();

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification Received:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification Clicked:", response);
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  useEffect(() => {
    if (consentCompleted) {
      getOrRegisterPushToken()
        .then((token) => {
          if (token) {
            setExpoPushToken(token);
            console.log("Expo Push Token:", token);
          } else {
            console.warn("No Expo push token returned.");
          }
        })
        .catch((error) => {
          console.error("Error during push registration:", error);
        });
    }
  }, [consentCompleted]);

  return (
    <SafeAreaProvider>
      <View style={styles.appContainer}>
        {Platform.OS === "ios" && <View style={styles.statusBarBackground} />}
        <LoaderProvider>
          <RefreshProvider>
            <ThemeProvider value={DefaultTheme}>
              <StatusBar
                backgroundColor={Colors.background}
                translucent={true}
                style="light"
              />
              <SafeAreaView
                style={styles.safeArea}
                edges={["top", "left", "right"]}
              >
                <BannerAd />
                <ConsentDialog
                  onConsentCompleted={() => setConsentCompleted(true)}
                />
                <Slot />
              </SafeAreaView>
            </ThemeProvider>
          </RefreshProvider>
        </LoaderProvider>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  statusBarBackground: {
    backgroundColor: Colors.background,
    zIndex: 10,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

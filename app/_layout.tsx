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
import { SavedContentProvider } from "@/contexts/SavedContentContext";
import { WebViewNavigationProvider } from "@/contexts/WebViewNavigationContext";
import { WebViewProvider } from "@/contexts/WebViewContext";
import { getOrRegisterPushToken } from "@/utils/pushToken";
import { initializeInterstitial } from "@/components/ads/InterstitialAd";
import { loadAppOpenAd } from "@/components/ads/AppOpenAd";
import OfflineGuard from "@/components/OfflineGuard";

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
    initializeInterstitial();
    loadAppOpenAd();

    notificationListener.current =
      Notifications.addNotificationReceivedListener(() => {});

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(() => {});

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
          }
        })
        .catch(() => {});
    }
  }, [consentCompleted]);

  return (
    <SafeAreaProvider>
      <View style={styles.appContainer}>
        {Platform.OS === "ios" && <View style={styles.statusBarBackground} />}
        <LoaderProvider>
          <RefreshProvider>
            <SavedContentProvider>
              <WebViewNavigationProvider>
                <WebViewProvider>
                  <ThemeProvider value={DefaultTheme}>
                    <StatusBar
                      backgroundColor={Colors.background}
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
                      <OfflineGuard>
                        <Slot />
                      </OfflineGuard>
                    </SafeAreaView>
                  </ThemeProvider>
                </WebViewProvider>
              </WebViewNavigationProvider>
            </SavedContentProvider>
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

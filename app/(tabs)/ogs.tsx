import React, { useEffect, useRef, useState } from "react";
import { AppState, Platform, StyleSheet, View, Linking } from "react-native";
import { WebView } from "react-native-webview";
import { useRefresh } from "@/contexts/RefreshContext";
import { Colors } from "@/constants/Colors";
import { useLoader } from "@/contexts/LoaderContext";
import { useGlobalAds } from "@/components/ads/adsManager";
import { Pressable } from "react-native";

export default function OgsScreen() {
  const { refreshCount } = useRefresh("ogs");
  const { showLoader, hideLoader } = useLoader();
  const webViewRef = useRef<WebView | null>(null);
  const [webViewKey, setWebViewKey] = useState(0);
  const defaultUrl = "https://www.thecrypto.wiki/crypto-ogs/";
  const [currentUrl, setCurrentUrl] = useState(defaultUrl);

  const injectedJavaScript = `
    document.cookie = "isApp=true; path=/";
    window.addEventListener('click', function() {
      window.ReactNativeWebView.postMessage('ad');
    });
    true;
  `;

  const { handleGlobalPress } = useGlobalAds();

  useEffect(() => {
    setCurrentUrl(defaultUrl);
    setWebViewKey((prev) => prev + 1);
    showLoader();
  }, [refreshCount]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        setWebViewKey((prev) => prev + 1);
        showLoader();
      }
    });
    return () => subscription.remove();
  }, []);

  const handleNavigationStateChange = (navState: any) => {
    if (!navState.loading) {
      setCurrentUrl(navState.url);
      hideLoader();
    }
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    const { url } = request;
    if (!url.includes("thecrypto.wiki")) {
      Linking.openURL(url);
      return false;
    }
    return true;
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      {Platform.OS === "web" ? (
        <iframe
          key={webViewKey}
          src={currentUrl}
          style={{ width: "100%", height: "100vh", border: "none" }}
          title="TheCrypto.wiki - Crypto OGS"
          onLoad={hideLoader}
        />
      ) : (
        <>
          <WebView
            ref={webViewRef}
            key={webViewKey}
            source={{ uri: currentUrl }}
            cacheEnabled
            domStorageEnabled
            style={styles.webview}
            injectedJavaScript={injectedJavaScript}
            onMessage={(event) => {
              if (event.nativeEvent.data === "ad") {
                handleGlobalPress();
              }
            }}
            onLoadStart={showLoader}
            onNavigationStateChange={handleNavigationStateChange}
            onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          />
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleGlobalPress}
            pointerEvents="box-none"
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: Colors.background,
    marginBottom: Platform.OS === "android" ? -65 : 65,
  },
});

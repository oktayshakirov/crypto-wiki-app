import React, { useRef, useEffect, useState } from "react";
import { AppState, Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { useRefresh } from "@/contexts/RefreshContext";
import { Colors } from "@/constants/Colors";
import { useLoader } from "@/contexts/LoaderContext";
import { useGlobalAds } from "@/components/ads/adsManager";
import { Pressable } from "react-native";
import { openBrowserAsync } from "expo-web-browser";

export default function ToolsScreen() {
  const { refreshCount } = useRefresh("tools");
  const { showLoaderMin, hideLoaderMin, isContentVisible } =
    useLoader();
  const webViewRef = useRef<WebView | null>(null);
  const [webViewKey, setWebViewKey] = useState(0);
  const defaultUrl = "https://www.thecrypto.wiki/tools/?isApp=true";
  const [currentUrl, setCurrentUrl] = useState(defaultUrl);

  const injectedJavaScript = `
  localStorage.setItem('isApp', 'true');
  window.addEventListener('click', function() {
    window.ReactNativeWebView.postMessage('ad');
  });

  true;
`;

  const { handleGlobalPress } = useGlobalAds();

  useEffect(() => {
    setCurrentUrl(defaultUrl);
    setWebViewKey((prev) => prev + 1);
    showLoaderMin();
  }, [refreshCount]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        setWebViewKey((prev) => prev + 1);
        showLoaderMin();
      }
    });
    return () => subscription.remove();
  }, []);

  const handleNavigationStateChange = (navState: any) => {
    if (!navState.loading) {
      setCurrentUrl(navState.url);
      hideLoaderMin();
    }
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    const { url } = request;
    if (!url.includes("thecrypto.wiki")) {
      openBrowserAsync(url);
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
          style={{
            width: "100%",
            height: "100vh",
            border: "none",
            opacity: isContentVisible ? 1 : 0,
          }}
          title="TheCrypto.wiki - Tools"
          onLoad={hideLoaderMin}
        />
      ) : (
        <>
          <WebView
            ref={webViewRef}
            key={webViewKey}
            source={{ uri: currentUrl }}
            cacheEnabled
            domStorageEnabled
            style={[styles.webview, { opacity: isContentVisible ? 1 : 0 }]}
            injectedJavaScript={injectedJavaScript}
            onMessage={(event) => {
              if (event.nativeEvent.data === "ad") {
                handleGlobalPress();
              }
            }}
            onLoadStart={() => showLoaderMin()}
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

import React, { useRef, useEffect, useState } from "react";
import { AppState, Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { useRefresh } from "@/contexts/RefreshContext";
import { Colors } from "@/constants/Colors";
import { useLoader } from "@/contexts/LoaderContext";
import { useSavedContent } from "@/contexts/SavedContentContext";
import { useGlobalAds } from "@/components/ads/adsManager";
import { handleNetworkError } from "@/utils/networkErrorHandler";
import { Pressable } from "react-native";
import { openBrowserAsync } from "expo-web-browser";
import { useFocusEffect, useRouter } from "expo-router";

export default function ToolsScreen() {
  const router = useRouter();
  const { refreshCount } = useRefresh("tools");
  const { showLoaderMin, hideLoaderMin, isContentVisible } = useLoader();
  const { setCurrentUrl: setSavedContentUrl, forceRefreshSavedState } =
    useSavedContent();
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

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "NAVIGATE" && data.path === "/portfolio") {
        router.push("/portfolio");
      }
    } catch (error) {
      if (event.nativeEvent.data === "ad") {
        handleGlobalPress();
      }
    }
  };

  useEffect(() => {
    setCurrentUrl(defaultUrl);
    setSavedContentUrl(defaultUrl);
    setWebViewKey((prev) => prev + 1);
    showLoaderMin();
  }, [refreshCount, setSavedContentUrl]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        setWebViewKey((prev) => prev + 1);
        showLoaderMin();
      }
    });
    return () => subscription.remove();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      forceRefreshSavedState();
    }, [forceRefreshSavedState])
  );

  const handleNavigationStateChange = (navState: any) => {
    if (!navState.loading && navState.url) {
      setCurrentUrl(navState.url);
      setSavedContentUrl(navState.url);
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
            onMessage={handleMessage}
            onLoadStart={() => showLoaderMin()}
            onNavigationStateChange={handleNavigationStateChange}
            onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              handleNetworkError(nativeEvent);
            }}
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

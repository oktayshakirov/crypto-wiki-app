import React, { useRef, useEffect, useState } from "react";
import { AppState, Platform, StyleSheet, View, Pressable } from "react-native";
import { WebView } from "react-native-webview";
import { useFocusEffect } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import { useRefresh } from "@/contexts/RefreshContext";
import { Colors } from "@/constants/Colors";
import { useLoader } from "@/contexts/LoaderContext";
import { useSavedContent } from "@/contexts/SavedContentContext";
import { useWebViewNavigation } from "@/contexts/WebViewNavigationContext";
import { useWebView } from "@/contexts/WebViewContext";
import { useGlobalAds } from "@/components/ads/adsManager";
import { handleNetworkError } from "@/utils/networkErrorHandler";

export default function HomeScreen() {
  const { refreshCount } = useRefresh("home");
  const { showLoaderMin, hideLoaderMin, isContentVisible } = useLoader();
  const { setCurrentUrl: setSavedContentUrl, forceRefreshSavedState } =
    useSavedContent();
  const { pendingNavigation, clearPendingNavigation } = useWebViewNavigation();
  const { registerWebView, unregisterWebView } = useWebView();
  const webViewRef = useRef<WebView | null>(null);
  const [webViewKey, setWebViewKey] = useState(0);
  const defaultUrl = "https://www.thecrypto.wiki/?isApp=true";
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
    setSavedContentUrl(defaultUrl);
    setWebViewKey((prev) => prev + 1);
    showLoaderMin();
  }, [refreshCount, setSavedContentUrl]);

  useEffect(() => {
    if (pendingNavigation && !pendingNavigation.targetTab) {
      setCurrentUrl(pendingNavigation.url);
      setSavedContentUrl(pendingNavigation.url);
      setWebViewKey((prev) => prev + 1);
      showLoaderMin();
      clearPendingNavigation();
    }
  }, [
    pendingNavigation,
    clearPendingNavigation,
    setSavedContentUrl,
    showLoaderMin,
  ]);

  useEffect(() => {
    if (webViewRef.current) {
      registerWebView("home", webViewRef);
    }
    return () => unregisterWebView("home");
  }, [registerWebView, unregisterWebView]);

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
          title="TheCrypto.wiki - Home"
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
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === "URL_CHECK") {
                  (global as any).webviewCurrentUrl = data.fullUrl;
                  (global as any).webviewCurrentPath = data.currentPath;
                } else if (data.type === "URL_VERIFICATION") {
                  (global as any).webviewCurrentUrl = data.currentUrl;
                  (global as any).webviewCurrentPath = data.currentPath;
                } else if (data.type === "METADATA_EXTRACTED") {
                  (global as any).extractedMetadata = data.metadata;
                } else if (event.nativeEvent.data === "ad") {
                  handleGlobalPress();
                }
              } catch {
                if (event.nativeEvent.data === "ad") {
                  handleGlobalPress();
                }
              }
            }}
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

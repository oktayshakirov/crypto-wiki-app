// The /videos feed, wrapped. Structurally a copy of the sibling tabs - see
// posts.tsx; the five of them differ only in URL, refresh key and title, and
// are overdue for one shared screen the way tinnitus-app already has.
import React, { useRef, useEffect, useState } from "react";
import { Platform, StyleSheet, View, Pressable } from "react-native";
import { WebView } from "react-native-webview";
import { useFocusEffect, useRouter } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import { useRefresh } from "@/contexts/RefreshContext";
import { Colors } from "@/constants/Colors";
import { useLoader } from "@/contexts/LoaderContext";
import { useSavedContent } from "@/contexts/SavedContentContext";
import { useWebViewNavigation } from "@/contexts/WebViewNavigationContext";
import { useWebView } from "@/contexts/WebViewContext";
import { useGlobalAds } from "@/components/ads/adsManager";
import { handleNetworkError } from "@/utils/networkErrorHandler";
import { useStaleWebViewReload } from "@/hooks/useStaleWebViewReload";
import { useWebViewHttpRetry } from "@/hooks/useWebViewHttpRetry";
import {
  createShouldStartLoadWithRequest,
  VIDEO_WEBVIEW_PROPS,
} from "@/utils/webViewVideo";
import { handleNativeNavigation } from "@/utils/webViewBridge";

export default function VideosScreen() {
  const router = useRouter();
  const { refreshCount } = useRefresh("videos");
  const { showLoaderMin, hideLoaderMin, isContentVisible } = useLoader();
  const { setCurrentUrl: setSavedContentUrl, forceRefreshSavedState } =
    useSavedContent();
  const { pendingNavigation, clearPendingNavigation } = useWebViewNavigation();
  const { registerWebView, unregisterWebView } = useWebView();
  const webViewRef = useRef<WebView | null>(null);
  const [webViewKey, setWebViewKey] = useState(0);
  const defaultUrl = "https://www.thecrypto.wiki/videos/?isApp=true";
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

  // Deep link to a single /videos/<slug> page, same mechanism the other tabs use.
  useEffect(() => {
    if (pendingNavigation?.targetTab !== "videos") {
      return;
    }
    setCurrentUrl(pendingNavigation.url);
    setSavedContentUrl(pendingNavigation.url);
    setWebViewKey((prev) => prev + 1);
    showLoaderMin();
    clearPendingNavigation();
  }, [
    pendingNavigation,
    clearPendingNavigation,
    setSavedContentUrl,
    showLoaderMin,
  ]);

  useStaleWebViewReload(() => {
    setWebViewKey((prev) => prev + 1);
    showLoaderMin();
  });

  // Absorbs the brief 404 a freshly deployed page can return when a push
  // notification is tapped the instant it arrives.
  const handleHttpError = useWebViewHttpRetry(currentUrl, () => {
    setWebViewKey((prev) => prev + 1);
    showLoaderMin();
  });

  useEffect(() => {
    if (webViewRef.current) {
      // The sibling tabs pass the ref bare and trip a null-assignability error;
      // no reason to copy that too.
      registerWebView("videos", webViewRef as React.RefObject<WebView>);
    }
    return () => unregisterWebView("videos");
  }, [registerWebView, unregisterWebView]);

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

  const handleShouldStartLoadWithRequest = createShouldStartLoadWithRequest(
    "thecrypto.wiki",
    (url) => {
      openBrowserAsync(url);
    }
  );

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
          title="TheCrypto.wiki - Videos"
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
            {...VIDEO_WEBVIEW_PROPS}
            style={[styles.webview, { opacity: isContentVisible ? 1 : 0 }]}
            injectedJavaScript={injectedJavaScript}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (handleNativeNavigation(data, router)) {
                  return;
                }
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
            onHttpError={handleHttpError}
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

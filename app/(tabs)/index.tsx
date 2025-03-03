import React, { useRef, useEffect, useState } from "react";
import { AppState, Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { useRefresh } from "@/contexts/RefreshContext";
import { Colors } from "@/constants/Colors";
import { useLoader } from "@/contexts/LoaderContext";

export default function HomeScreen() {
  const { refreshCount } = useRefresh("home");
  const { showLoader, hideLoader } = useLoader();
  const webViewRef = useRef<WebView | null>(null);
  const [webViewKey, setWebViewKey] = useState(0);
  const defaultUrl = "https://www.thecrypto.wiki/?isApp=true";
  const [currentUrl, setCurrentUrl] = useState(defaultUrl);

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

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      {Platform.OS === "web" ? (
        <iframe
          key={webViewKey}
          src={currentUrl}
          style={{ width: "100%", height: "100vh", border: "none" }}
          title="TheCrypto.wiki - Home"
          onLoad={hideLoader}
        />
      ) : (
        <WebView
          ref={webViewRef}
          key={webViewKey}
          source={{ uri: currentUrl }}
          cacheEnabled
          domStorageEnabled
          style={styles.webview}
          injectedJavaScript={`window.isApp = true; true;`}
          onLoadStart={showLoader}
          onNavigationStateChange={handleNavigationStateChange}
        />
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
    marginBottom: Platform.OS === "android" ? -70 : 0,
  },
});

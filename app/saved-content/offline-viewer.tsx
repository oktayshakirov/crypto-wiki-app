import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
} from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Colors } from "@/constants/Colors";
import { SavedContentStorage, SavedContent } from "@/utils/savedContentStorage";
import MaterialIcons from "@expo/vector-icons/Fontisto";
import { useWebView } from "@/contexts/WebViewContext";
import { handleNetworkError } from "@/utils/networkErrorHandler";

export default function OfflineViewerScreen() {
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>();
  const router = useRouter();
  const [content, setContent] = useState<SavedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [webViewKey, setWebViewKey] = useState(0);
  const webViewRef = useRef<WebView>(null);
  const { registerWebView, unregisterWebView } = useWebView();

  useEffect(() => {
    loadContent();
  }, [type, id]);

  useEffect(() => {
    if (webViewRef.current) {
      registerWebView("offline-viewer", webViewRef);
    }
    return () => unregisterWebView("offline-viewer");
  }, [registerWebView, unregisterWebView]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        setWebViewKey((prev) => prev + 1);
      }
    });
    return () => subscription.remove();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        if (webViewRef.current) {
          try {
            webViewRef.current.stopLoading();
          } catch (error) {
            // Ignore errors during cleanup
          }
        }
      };
    }, [])
  );

  const loadContent = async () => {
    if (!type || !id) {
      setLoading(false);
      return;
    }

    try {
      const savedContent = await SavedContentStorage.getSavedContentById(
        type as SavedContent["type"],
        id
      );
      setContent(savedContent);
    } catch {
      setContent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    if (webViewRef.current) {
      try {
        webViewRef.current.stopLoading();
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    router.back();
  };

  const renderContentHeader = () => {
    if (!content) return null;

    return (
      <View style={styles.header}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-left" size={20} color={Colors.text} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.savedDate}>
            Saved: {new Date(content.savedAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.headerContent}>
          <View style={styles.contentInfo}>
            <Text style={styles.contentTitle}>{content.title}</Text>
          </View>
        </View>
      </View>
    );
  };

  const htmlContent = content?.content
    ? `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              margin: 0;
              padding: 20px;
              padding-bottom: 80px;
              background-color: #000000;
              color: #ffffff;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
            }
            
            img {
              max-width: 100%;
              height: auto;
              margin-top: 24px;
              margin-bottom: 16px;
            }
            
            ul {
              list-style-type: disc !important;
              padding-left: 20px !important;
              margin-bottom: 16px !important;
              list-style-position: outside !important;
            }
            
            ol {
              list-style-type: decimal !important;
              padding-left: 20px !important;
              margin-bottom: 16px !important;
              list-style-position: outside !important;
            }
            
            li {
              margin-bottom: 8px !important;
              display: list-item !important;
            }
            
            h1, h2, h3, h4, h5, h6 {
              margin-top: 32px !important;
              margin-bottom: 16px !important;
            }
            
            p {
              margin-top: 16px !important;
              margin-bottom: 16px !important;
            }
            
            * {
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          ${
            content.image
              ? `<img src="${content.image}" style="width: 100%; height: auto; margin-bottom: 24px; border-radius: 8px; display: block;" alt="Content image" />`
              : ""
          }
          ${content.content}
        </body>
      </html>
    `
    : "";

  return (
    <View style={styles.container}>
      {content && renderContentHeader()}
      <WebView
        ref={webViewRef}
        key={`${type}-${id}-${webViewKey}`}
        source={{ html: htmlContent }}
        cacheEnabled={false}
        domStorageEnabled={true}
        style={styles.webView}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          handleNetworkError(nativeEvent);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    marginBottom: 0,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 8,
  },
  backButtonText: {
    color: Colors.text,
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "500",
  },
  headerContent: {
    flexDirection: "row",
    padding: 16,
    paddingTop: 0,
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  savedDate: {
    fontSize: 12,
    color: Colors.icon,
    opacity: 0.8,
  },

  webView: {
    flex: 1,
    backgroundColor: "#000000",
  },
});

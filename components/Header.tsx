import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  AppState,
} from "react-native";
import { Colors } from "@/constants/Colors";
import MaterialIcons from "@expo/vector-icons/Fontisto";
import { useRefresh } from "@/contexts/RefreshContext";
import { useSavedContent } from "@/contexts/SavedContentContext";
import { useWebView } from "@/contexts/WebViewContext";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { useSegments, useRouter, useFocusEffect } from "expo-router";
import { RemoveContentDialog } from "@/components/RemoveContentDialog";
import HeaderMenu from "@/components/HeaderMenu";
import { ContentSaver } from "@/utils/ContentSaver";

const ROUTE_REFRESH_MAP: Record<string, string> = {
  index: "home",
  posts: "posts",
  exchanges: "exchanges",
  ogs: "ogs",
  tools: "tools",
};

export default function Header() {
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const {
    currentUrl,
    isCurrentPageSaveable,
    isCurrentPageSaved,
    saveCurrentPage,
    removeSavedContent,
    currentPageType,
    currentPageSlug,
    savedCounts,
    forceRefreshSavedState,
  } = useSavedContent();
  const { getWebViewRef } = useWebView();
  const { assets, getTotalProfitLoss } = usePortfolio();

  useEffect(() => {
    forceRefreshSavedState();
  }, [forceRefreshSavedState]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        forceRefreshSavedState();
      }
    });

    return () => subscription.remove();
  }, [forceRefreshSavedState]);

  useFocusEffect(
    React.useCallback(() => {
      forceRefreshSavedState();
    }, [forceRefreshSavedState])
  );

  const segments = useSegments();
  const currentRoute = segments[segments.length - 1] || "index";
  const parentRoute = segments[segments.length - 2] || "";

  const refreshKey = ROUTE_REFRESH_MAP[currentRoute] || "home";

  const { triggerRefresh } = useRefresh(refreshKey);

  const handleSaveContent = async () => {
    if (isSaving) return;

    setIsSaving(true);

    try {
      if (isCurrentPageSaved) {
        if (currentPageType && currentPageSlug) {
          RemoveContentDialog.show({
            contentType: currentPageType,
            onRemove: async () => {
              return await removeSavedContent(currentPageType, currentPageSlug);
            },
            onSuccess: () => {
              Alert.alert("Success", "Content removed from saved items");
            },
            onError: () => {
              Alert.alert("Error", "Failed to remove content");
            },
          });
        }
      } else {
        Alert.alert(
          "Save Content",
          "This page will be saved for offline viewing",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Save",
              onPress: async () => {
                if (!currentUrl || !isCurrentPageSaveable) {
                  Alert.alert("Error", "Cannot save this page");
                  return;
                }

                await ContentSaver.saveContent(
                  currentUrl,
                  currentPageType,
                  currentPageSlug,
                  getWebViewRef,
                  saveCurrentPage
                );
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const menuItems = [
    {
      label: "Saved Posts",
      icon: "quote-a-left",
      route: "/saved-content/saved-posts",
      count: savedCounts.posts,
    },
    {
      label: "Saved Exchanges",
      icon: "bitcoin",
      route: "/saved-content/saved-exchanges",
      count: savedCounts.exchanges,
    },
    {
      label: "Saved OG's",
      icon: "persons",
      route: "/saved-content/saved-ogs",
      count: savedCounts["crypto-ogs"],
    },
  ];

  // Portfolio badge logic
  const portfolioCount = assets.length;
  const { amount: totalProfitLoss } = getTotalProfitLoss();
  const isPortfolioProfit = totalProfitLoss >= 0;
  const showPortfolioBadge = portfolioCount > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.logoContainer}
          onPress={() => {
            if (parentRoute === "saved-content") {
              router.push("/(tabs)/");
            } else if (currentRoute === "portfolio") {
              router.push("/(tabs)/");
            } else {
              triggerRefresh();
            }
          }}
          activeOpacity={0.7}
        >
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {isCurrentPageSaveable && (
          <TouchableOpacity
            style={styles.bookmarkButton}
            onPress={handleSaveContent}
            activeOpacity={0.7}
            disabled={isSaving}
          >
            <MaterialIcons
              name={isCurrentPageSaved ? "check" : "download"}
              size={24}
              color={isCurrentPageSaved ? Colors.activeIcon : Colors.text}
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.portfolioButton}
          onPress={() => router.push("/portfolio")}
          activeOpacity={0.7}
        >
          <MaterialIcons name="dollar" size={24} color={Colors.text} />
          {showPortfolioBadge && (
            <View
              style={[
                styles.portfolioBadge,
                {
                  backgroundColor: isPortfolioProfit ? "#4ade80" : "#f87171",
                },
              ]}
            >
              <Text style={styles.portfolioBadgeText}>{portfolioCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <HeaderMenu savedCounts={savedCounts} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1000,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logo: {
    width: 200,
    height: 40,
  },
  bookmarkButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  portfolioButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
    position: "relative",
  },
  portfolioBadge: {
    position: "absolute",
    top: 4,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  portfolioBadgeText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
  },
});

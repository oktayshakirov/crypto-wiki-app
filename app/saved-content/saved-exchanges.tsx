import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { useRefresh } from "@/contexts/RefreshContext";
import { useSavedContent } from "@/contexts/SavedContentContext";
import { useWebViewNavigation } from "@/contexts/WebViewNavigationContext";
import { SavedContentStorage, SavedContent } from "@/utils/savedContentStorage";
import MaterialIcons from "@expo/vector-icons/Fontisto";
import { useRouter } from "expo-router";
import { RemoveContentDialog } from "@/components/RemoveContentDialog";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import OfflineImage from "@/components/OfflineImage";

export default function SavedExchangesScreen() {
  const { refreshCount } = useRefresh("saved-exchanges");
  const { refreshSavedCounts } = useSavedContent();
  const { navigateToUrl } = useWebViewNavigation();
  const router = useRouter();
  const [savedExchanges, setSavedExchanges] = useState<SavedContent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { isOffline } = useNetworkStatus();

  useEffect(() => {
    loadSavedExchanges();
  }, [refreshCount]);

  const loadSavedExchanges = async () => {
    try {
      const exchanges = await SavedContentStorage.getSavedContent("exchanges");
      setSavedExchanges(exchanges);
    } catch {
      setSavedExchanges([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedExchanges();
    setRefreshing(false);
  };

  const handleRemoveExchange = async (exchangeId: string) => {
    RemoveContentDialog.show({
      contentType: "exchanges",
      onRemove: async () => {
        try {
          await SavedContentStorage.removeSavedContent("exchanges", exchangeId);
          await loadSavedExchanges();
          await refreshSavedCounts();
          return true;
        } catch {
          return false;
        }
      },
      onSuccess: () => {},
      onError: () => {
        Alert.alert("Error", "Failed to remove exchange");
      },
    });
  };

  const renderSavedExchange = ({ item }: { item: SavedContent }) => (
    <TouchableOpacity
      style={styles.exchangeCard}
      activeOpacity={0.7}
      onPress={() => {
        router.push({
          pathname: "/saved-content/offline-viewer",
          params: { type: "exchanges", id: item.id },
        });
      }}
    >
      <View style={styles.exchangeHeader}>
        <OfflineImage
          source={item.image ? { uri: item.image } : undefined}
          style={styles.exchangeImage}
          resizeMode="cover"
          fallbackIcon="bitcoin"
          fallbackIconSize={32}
        />
        <View style={styles.exchangeContent}>
          <View style={styles.titleRow}>
            <Text style={styles.exchangeTitle}>{item.title}</Text>
            <TouchableOpacity
              style={styles.removeButton}
              activeOpacity={0.7}
              onPress={(e) => {
                e.stopPropagation();
                handleRemoveExchange(item.id);
              }}
            >
              <MaterialIcons name="trash" size={16} color={Colors.icon} />
            </TouchableOpacity>
          </View>

          <Text style={styles.exchangeDescription} numberOfLines={3}>
            {item.description}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/(tabs)/")}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-left" size={12} color={Colors.text} />
            <Text style={styles.backButtonText}>Live Content</Text>
          </TouchableOpacity>

          <View style={styles.titleSection}>
            <Text style={styles.headerTitle}>Saved Exchanges</Text>
            <Text style={styles.exchangeCount}>
              {savedExchanges.length} exchanges saved
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={savedExchanges}
        renderItem={renderSavedExchange}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.highlight}
            colors={[Colors.highlight]}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="bitcoin" size={48} color={Colors.icon} />
            <Text style={styles.emptyTitle}>No Saved Exchanges</Text>
            <Text style={styles.emptySubtitle}>
              Exchange reviews you save will appear here for offline reading
            </Text>
          </View>
        }
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
    padding: 16,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#333",
    borderRadius: 6,
  },
  backButtonText: {
    fontSize: 13,
    color: Colors.text,
    marginLeft: 6,
    fontWeight: "500",
  },
  titleSection: {
    flex: 1,
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 2,
    textAlign: "right",
  },
  exchangeCount: {
    fontSize: 13,
    color: Colors.icon,
    opacity: 0.8,
    textAlign: "right",
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  exchangeCard: {
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  exchangeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  exchangeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#333",
  },
  exchangeContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  exchangeInfo: {
    flex: 1,
    marginRight: 12,
  },
  exchangeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  exchangeDescription: {
    fontSize: 14,
    color: Colors.icon,
    lineHeight: 20,
  },
  exchangeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  dateSection: {
    flex: 1,
  },
  publishedDate: {
    fontSize: 11,
    color: Colors.highlight,
    marginBottom: 2,
  },

  exchangeDate: {
    fontSize: 12,
    color: Colors.icon,
  },
  exchangeType: {
    fontSize: 12,
    color: Colors.highlight,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.icon,
    textAlign: "center",
    lineHeight: 20,
  },
});

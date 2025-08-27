import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { useRefresh } from "@/contexts/RefreshContext";
import { useLoader } from "@/contexts/LoaderContext";
import MaterialIcons from "@expo/vector-icons/Fontisto";
import { useRouter } from "expo-router";

interface SavedExchange {
  id: string;
  title: string;
  description: string;
  date: string;
  image: string;
}

export default function SavedExchangesScreen() {
  const { refreshCount } = useRefresh("saved-exchanges");
  const { showLoader, hideLoader } = useLoader();
  const router = useRouter();
  const [savedExchanges, setSavedExchanges] = useState<SavedExchange[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - replace with actual saved exchanges from your storage
  const mockSavedExchanges: SavedExchange[] = [
    // Temporarily empty to test "no content" scenario
    // Uncomment the exchanges below to test "with content" scenario
    /*
    {
      id: "1",
      title: "Binance Exchange Review",
      description:
        "World's largest cryptocurrency exchange by trading volume. Offers spot trading, futures, staking, and more.",
      date: "2024-09-03",
      image: "/images/exchanges/binance.jpg",
    },
    {
      id: "2",
      title: "Uniswap DEX Analysis",
      description:
        "Leading decentralized exchange built on Ethereum. Enables peer-to-peer trading without intermediaries.",
      date: "2024-09-01",
      image: "/images/exchanges/uniswap.jpg",
    },
    {
      id: "3",
      title: "Coinbase Pro Platform Review",
      description:
        "Professional trading platform from Coinbase. Advanced charting and trading tools for experienced users.",
      date: "2024-08-28",
      image: "/images/exchanges/coinbase-pro.jpg",
    },
    */
  ];

  useEffect(() => {
    loadSavedExchanges();
  }, [refreshCount]);

  const loadSavedExchanges = async () => {
    // Only show loader if we have content to load
    if (mockSavedExchanges.length > 0) {
      showLoader();
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSavedExchanges(mockSavedExchanges);
    } else {
      setSavedExchanges([]);
    }
    hideLoader();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedExchanges();
    setRefreshing(false);
  };

  const renderSavedExchange = ({ item }: { item: SavedExchange }) => (
    <TouchableOpacity style={styles.exchangeCard} activeOpacity={0.7}>
      <View style={styles.exchangeHeader}>
        <View style={styles.exchangeInfo}>
          <Text style={styles.exchangeTitle}>{item.title}</Text>
        </View>
        <TouchableOpacity style={styles.removeButton} activeOpacity={0.7}>
          <MaterialIcons name="close" size={16} color={Colors.icon} />
        </TouchableOpacity>
      </View>

      <Text style={styles.exchangeDescription} numberOfLines={3}>
        {item.description}
      </Text>

      <View style={styles.exchangeFooter}>
        <Text style={styles.exchangeDate}>{item.date}</Text>
        <Text style={styles.exchangeImage}>{item.image}</Text>
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
            <Text style={styles.backButtonText}>Back to Home</Text>
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
  },
  exchangeCard: {
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  exchangeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  exchangeInfo: {
    flex: 1,
    marginRight: 12,
  },
  exchangeTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  removeButton: {
    padding: 4,
  },
  exchangeDescription: {
    fontSize: 14,
    color: Colors.icon,
    lineHeight: 20,
    marginBottom: 16,
  },
  exchangeFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exchangeDate: {
    fontSize: 12,
    color: Colors.icon,
  },
  exchangeImage: {
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

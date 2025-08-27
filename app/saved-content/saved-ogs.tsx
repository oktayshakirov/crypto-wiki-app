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

interface SavedOG {
  id: string;
  title: string;
  description: string;
  date: string;
  image: string;
}

export default function SavedOgsScreen() {
  const { refreshCount } = useRefresh("saved-ogs");
  const { showLoader, hideLoader } = useLoader();
  const router = useRouter();
  const [savedOGs, setSavedOGs] = useState<SavedOG[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - replace with actual saved OG's from your storage
  const mockSavedOGs: SavedOG[] = [
    // Temporarily empty to test "no content" scenario
    // Uncomment the OGs below to test "with content" scenario
    /*
    {
      id: "1",
      title: "Vitalik Buterin: Ethereum Co-Founder Profile",
      description:
        "Russian-Canadian programmer and writer who co-founded Ethereum. Known for his contributions to blockchain technology and cryptocurrency.",
      date: "2024-09-03",
      image: "/images/ogs/vitalik-buterin.jpg",
    },
    {
      id: "2",
      title: "Satoshi Nakamoto: Bitcoin Creator Analysis",
      description:
        "Pseudonymous person or group who created Bitcoin and authored the original Bitcoin white paper. Identity remains unknown.",
      date: "2024-09-01",
      image: "/images/ogs/saved-ogs.jpg",
    },
    {
      id: "3",
      title: "Changpeng Zhao (CZ): Binance CEO Profile",
      description:
        "Canadian business executive and founder of Binance, the world's largest cryptocurrency exchange by trading volume.",
      date: "2024-08-28",
      image: "/images/ogs/changpeng-zhao.jpg",
    },
    {
      id: "4",
      title: "Andreas Antonopoulos: Bitcoin Educator Profile",
      description:
        "Greek-British Bitcoin advocate, tech entrepreneur, and author. Known for his educational content about Bitcoin and cryptocurrency.",
      date: "2024-08-25",
      image: "/images/ogs/andreas-antonopoulos.jpg",
    },
    {
      id: "5",
      title: "Charlie Lee: Litecoin Creator Profile",
      description:
        "Computer scientist and former Google engineer who created Litecoin, often called the silver to Bitcoin's gold.",
      date: "2024-08-22",
      image: "/images/ogs/charlie-lee.jpg",
    },
    {
      id: "6",
      title: "Roger Ver: Bitcoin.com CEO Profile",
      description:
        "Early Bitcoin investor and advocate, known as 'Bitcoin Jesus' for his evangelism of cryptocurrency adoption.",
      date: "2024-08-20",
      image: "/images/ogs/roger-ver.jpg",
    },
    {
      id: "7",
      title: "Erik Voorhees: Shapeshift CEO Profile",
      description:
        "Entrepreneur and cryptocurrency advocate who founded Shapeshift, a non-custodial cryptocurrency exchange.",
      date: "2024-08-18",
      image: "/images/ogs/erik-voorhees.jpg",
    },
    {
      id: "8",
      title: "Trace Mayer: Bitcoin Investor Profile",
      description:
        "Bitcoin investor, entrepreneur, and advocate known for his long-term perspective on Bitcoin and cryptocurrency markets.",
      date: "2024-08-15",
      image: "/images/ogs/trace-mayer.jpg",
    },
    */
  ];

  useEffect(() => {
    loadSavedOGs();
  }, [refreshCount]);

  const loadSavedOGs = async () => {
    // Only show loader if we have content to load
    if (mockSavedOGs.length > 0) {
      showLoader();
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSavedOGs(mockSavedOGs);
    } else {
      setSavedOGs([]);
    }
    hideLoader();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedOGs();
    setRefreshing(false);
  };

  const renderSavedOG = ({ item }: { item: SavedOG }) => (
    <TouchableOpacity style={styles.ogCard} activeOpacity={0.7}>
      <View style={styles.ogHeader}>
        <View style={styles.ogInfo}>
          <Text style={styles.ogTitle}>{item.title}</Text>
        </View>
        <TouchableOpacity style={styles.removeButton} activeOpacity={0.7}>
          <MaterialIcons name="close" size={16} color={Colors.icon} />
        </TouchableOpacity>
      </View>

      <Text style={styles.ogDescription} numberOfLines={3}>
        {item.description}
      </Text>

      <View style={styles.ogFooter}>
        <Text style={styles.ogDate}>{item.date}</Text>
        <Text style={styles.ogImage}>{item.image}</Text>
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
            <Text style={styles.headerTitle}>Saved OG's</Text>
            <Text style={styles.ogCount}>
              {savedOGs.length} crypto pioneers saved
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={savedOGs}
        renderItem={renderSavedOG}
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
            <MaterialIcons name="persons" size={48} color={Colors.icon} />
            <Text style={styles.emptyTitle}>No Saved OG's</Text>
            <Text style={styles.emptySubtitle}>
              Crypto pioneers you save will appear here for offline reading
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
  ogCount: {
    fontSize: 13,
    color: Colors.icon,
    opacity: 0.8,
    textAlign: "right",
  },
  listContainer: {
    padding: 20,
  },
  ogCard: {
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  ogHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  ogInfo: {
    flex: 1,
    marginRight: 12,
  },
  ogTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  removeButton: {
    padding: 4,
  },
  ogDescription: {
    fontSize: 14,
    color: Colors.icon,
    lineHeight: 20,
    marginBottom: 16,
  },
  ogFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ogDate: {
    fontSize: 12,
    color: Colors.icon,
  },
  ogImage: {
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

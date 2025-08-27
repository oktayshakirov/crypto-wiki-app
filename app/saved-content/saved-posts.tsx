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

interface SavedPost {
  id: string;
  title: string;
  description: string;
  date: string;
  image: string;
}

export default function SavedPostsScreen() {
  const { refreshCount } = useRefresh("saved-posts");
  const { showLoader, hideLoader } = useLoader();
  const router = useRouter();
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - replace with actual saved posts from your storage
  const mockSavedPosts: SavedPost[] = [
    // Temporarily empty to test "no content" scenario
    // Uncomment the posts below to test "with content" scenario
    /*
    {
      id: "1",
      title: "AI and Blockchain: A New Era of Technological Innovations",
      description:
        "How AI and blockchain are transforming industries with transparency, security, and innovative solutions, paving the way for a new era of technology.",
      date: "2024-09-03",
      image: "/images/posts/ai-and-human.jpg",
    },
    {
      id: "2",
      title: "The Future of Bitcoin: What to Expect in 2024",
      description:
        "Bitcoin continues to evolve with new developments in scalability, security, and adoption. This comprehensive guide explores what's coming next...",
      date: "2024-01-15",
      image: "/images/posts/bitcoin-future.jpg",
    },
    {
      id: "3",
      title: "DeFi Revolution: Understanding Decentralized Finance",
      description:
        "Decentralized Finance is reshaping traditional financial services. Learn about the key concepts, risks, and opportunities in this emerging space...",
      date: "2024-01-12",
      image: "/images/posts/defi-revolution.jpg",
    },
    {
      id: "4",
      title: "NFT Market Analysis: Trends and Predictions",
      description:
        "The NFT market has seen significant changes. Discover the latest trends, market dynamics, and what the future holds for digital collectibles...",
      date: "2024-01-10",
      image: "/images/posts/nft-trends.jpg",
    },
    {
      id: "5",
      title: "Ethereum 2.0: The Complete Guide",
      description:
        "Ethereum's transition to proof-of-stake brings major improvements. Understand the technical changes, benefits, and implications for developers...",
      date: "2024-01-08",
      image: "/images/posts/ethereum-2.jpg",
    },
    */
  ];

  useEffect(() => {
    loadSavedPosts();
  }, [refreshCount]);

  const loadSavedPosts = async () => {
    // Only show loader if we have content to load
    if (mockSavedPosts.length > 0) {
      showLoader();
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSavedPosts(mockSavedPosts);
    } else {
      setSavedPosts([]);
    }
    hideLoader();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedPosts();
    setRefreshing(false);
  };

  const renderSavedPost = ({ item }: { item: SavedPost }) => (
    <TouchableOpacity style={styles.postCard} activeOpacity={0.7}>
      <View style={styles.postHeader}>
        <Text style={styles.postTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <TouchableOpacity style={styles.removeButton} activeOpacity={0.7}>
          <MaterialIcons name="close" size={16} color={Colors.icon} />
        </TouchableOpacity>
      </View>

      <Text style={styles.postDescription} numberOfLines={3}>
        {item.description}
      </Text>

      <View style={styles.postFooter}>
        <Text style={styles.postDate}>{item.date}</Text>
        <Text style={styles.postImage}>{item.image}</Text>
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
            <Text style={styles.headerTitle}>Saved Posts</Text>
            <Text style={styles.postCount}>
              {savedPosts.length} articles saved
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={savedPosts}
        renderItem={renderSavedPost}
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
            <MaterialIcons name="quote-a-left" size={48} color={Colors.icon} />
            <Text style={styles.emptyTitle}>No Saved Posts</Text>
            <Text style={styles.emptySubtitle}>
              Articles you save will appear here for offline reading
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
  postCount: {
    fontSize: 13,
    color: Colors.icon,
    opacity: 0.8,
    textAlign: "right",
  },
  listContainer: {
    padding: 20,
  },
  postCard: {
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    flex: 1,
    marginRight: 12,
  },
  removeButton: {
    padding: 4,
  },
  postDescription: {
    fontSize: 14,
    color: Colors.icon,
    lineHeight: 20,
    marginBottom: 16,
  },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  postDate: {
    fontSize: 12,
    color: Colors.icon,
  },
  postImage: {
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

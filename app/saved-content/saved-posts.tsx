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

export default function SavedPostsScreen() {
  const { refreshCount } = useRefresh("saved-posts");
  const { refreshSavedCounts } = useSavedContent();
  const { navigateToUrl } = useWebViewNavigation();
  const router = useRouter();
  const [savedPosts, setSavedPosts] = useState<SavedContent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { isOffline } = useNetworkStatus();

  useEffect(() => {
    loadSavedPosts();
  }, [refreshCount]);

  const loadSavedPosts = async () => {
    try {
      const posts = await SavedContentStorage.getSavedContent("posts");
      setSavedPosts(posts);
    } catch {
      setSavedPosts([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedPosts();
    setRefreshing(false);
  };

  const handleRemovePost = async (postId: string) => {
    RemoveContentDialog.show({
      contentType: "posts",
      onRemove: async () => {
        try {
          await SavedContentStorage.removeSavedContent("posts", postId);
          await loadSavedPosts();
          await refreshSavedCounts();
          return true;
        } catch {
          return false;
        }
      },
      onSuccess: () => {},
      onError: () => {
        Alert.alert("Error", "Failed to remove post");
      },
    });
  };

  const renderSavedPost = ({ item }: { item: SavedContent }) => {
    return (
      <TouchableOpacity
        style={styles.postCard}
        activeOpacity={0.7}
        onPress={() => {
          router.push({
            pathname: "/saved-content/offline-viewer",
            params: { type: "posts", id: item.id },
          });
        }}
      >
        <View style={styles.postHeader}>
          <OfflineImage
            source={item.image ? { uri: item.image } : undefined}
            style={styles.postImage}
            resizeMode="cover"
            fallbackIcon="quote-a-left"
            fallbackIconSize={32}
          />
          <View style={styles.postContent}>
            <View style={styles.titleRow}>
              <Text style={styles.postTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <TouchableOpacity
                style={styles.removeButton}
                activeOpacity={0.7}
                onPress={(e) => {
                  e.stopPropagation();
                  handleRemovePost(item.id);
                }}
              >
                <MaterialIcons name="trash" size={16} color={Colors.icon} />
              </TouchableOpacity>
            </View>

            <Text style={styles.postDescription} numberOfLines={3}>
              {item.description}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
    paddingBottom: 100,
  },
  postCard: {
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  postImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#333",
  },
  postContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  postDescription: {
    fontSize: 14,
    color: Colors.icon,
    lineHeight: 20,
  },
  postFooter: {
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

  postType: {
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

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Colors } from "@/constants/Colors";
import MaterialIcons from "@expo/vector-icons/Fontisto";
import { useRouter } from "expo-router";
import Header from "@/components/Header";

interface OfflineScreenProps {
  onRetry?: () => void;
  isRetrying?: boolean;
}

export default function OfflineScreen({
  onRetry,
  isRetrying,
}: OfflineScreenProps) {
  const router = useRouter();

  const handleViewSavedContent = () => {
    try {
      router.push("/saved-content/");
    } catch {
      try {
        router.replace("/saved-content/");
      } catch {}
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  return (
    <View style={styles.overlayContainer}>
      <Header />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="wifi" size={80} color={Colors.icon} />
        </View>

        <Text style={styles.title}>Oops! No Internet Connection</Text>

        <Text style={styles.message}>
          It looks like you're offline. Don't worry - you can still access all
          your saved content for offline reading.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleViewSavedContent}
            activeOpacity={0.7}
          >
            <MaterialIcons name="quote-a-left" size={20} color="#000" />
            <Text style={styles.primaryButtonText}>Saved Content</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleRetry}
            activeOpacity={0.7}
            disabled={isRetrying}
          >
            <MaterialIcons
              name={isRetrying ? "check" : "check"}
              size={20}
              color={isRetrying ? Colors.highlight : Colors.text}
            />
            <Text
              style={[
                styles.secondaryButtonText,
                isRetrying && styles.retryingText,
              ]}
            >
              {isRetrying ? "Checking..." : "Try Again"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    zIndex: 1000,
    borderTopWidth: 1,
    borderTopColor: "#333",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 400,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  iconContainer: {
    marginBottom: 24,
    opacity: 0.6,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 32,
  },
  message: {
    fontSize: 16,
    color: Colors.icon,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    opacity: 0.8,
  },
  buttonContainer: {
    width: "100%",
    marginBottom: 40,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.highlight,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.text,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  retryingText: {
    color: Colors.highlight,
    opacity: 0.8,
  },
});

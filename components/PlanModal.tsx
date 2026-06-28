import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useRevenueCat } from "@/contexts/RevenueCatContext";

const APP_STORE_ID = "6742765176";
const ANDROID_PACKAGE = "com.shadev.thecryptowiki";

const MANAGE_URL =
  Platform.OS === "ios"
    ? "https://apps.apple.com/account/subscriptions"
    : `https://play.google.com/store/account/subscriptions?package=${ANDROID_PACKAGE}`;

const STORE_URL =
  Platform.OS === "ios"
    ? `https://apps.apple.com/app/id${APP_STORE_ID}`
    : `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

interface PlanModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PlanModal({ visible, onClose }: PlanModalProps) {
  const {
    isPro,
    isReady,
    isSupported,
    planLabel,
    showPaywall,
    restoreUserPurchases,
    devProOverride,
    setDevProOverride,
  } = useRevenueCat();
  const [restoring, setRestoring] = useState(false);

  const handleUpgrade = async () => {
    if (!isSupported) {
      Alert.alert(
        "Not Supported",
        "In-app purchases are available only on iOS and Android."
      );
      return;
    }
    if (!isReady) {
      Alert.alert(
        "Please wait",
        "Store is still loading. Try again in a few seconds."
      );
      return;
    }
    await showPaywall();
  };

  const handleManageInStore = () => {
    Linking.openURL(MANAGE_URL).catch(() => Linking.openURL(STORE_URL));
  };

  const handleRestore = async () => {
    if (!isSupported) {
      Alert.alert(
        "Not Supported",
        "Restoring purchases is available only on iOS and Android."
      );
      return;
    }
    setRestoring(true);
    try {
      const restored = await restoreUserPurchases();
      Alert.alert(
        restored ? "Purchases Restored" : "Nothing to Restore",
        restored
          ? "Your Pro access has been restored. 🎉"
          : "We couldn't find any previous purchases on this account."
      );
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={styles.title}>Your Plan</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.planBadgeRow}>
            <View
              style={[
                styles.planBadge,
                { backgroundColor: isPro ? Colors.activeIcon : "#333" },
              ]}
            >
              <Text
                style={[
                  styles.planBadgeText,
                  { color: isPro ? "#000" : Colors.text },
                ]}
              >
                {planLabel}
              </Text>
            </View>
            <Text style={styles.planDescription}>
              {isPro
                ? "You have full access to all features, ad-free."
                : "Upgrade to remove ads and unlock all Pro features."}
            </Text>
          </View>

          {isPro ? (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleManageInStore}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="settings-outline"
                  size={18}
                  color="#000"
                  style={styles.buttonIcon}
                />
                <Text style={styles.primaryButtonText}>
                  Manage in {Platform.OS === "ios" ? "App Store" : "Play Store"}
                </Text>
              </TouchableOpacity>

              {planLabel === "Monthly" && (
                <View style={styles.tipCard}>
                  <Ionicons
                    name="sparkles-outline"
                    size={18}
                    color={Colors.activeIcon}
                    style={styles.tipIcon}
                  />
                  <Text style={styles.tipText}>
                    Save money with Pro Lifetime — pay once and keep Pro forever,
                    including all future features.
                  </Text>
                </View>
              )}

              {planLabel === "Lifetime" && (
                <View style={styles.tipCard}>
                  <Ionicons
                    name="heart-outline"
                    size={18}
                    color={Colors.activeIcon}
                    style={styles.tipIcon}
                  />
                  <Text style={styles.tipText}>
                    Thank you for your support! 🎉 You'll receive any future
                    features and improvements at no extra cost.
                  </Text>
                </View>
              )}
            </>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleUpgrade}
              activeOpacity={0.8}
            >
              <Ionicons
                name="star"
                size={18}
                color="#000"
                style={styles.buttonIcon}
              />
              <Text style={styles.primaryButtonText}>Upgrade to Pro</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleRestore}
            activeOpacity={0.8}
            disabled={restoring}
          >
            {restoring ? (
              <ActivityIndicator size="small" color={Colors.text} />
            ) : (
              <Text style={styles.secondaryButtonText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>

          {__DEV__ && (
            <View style={styles.devCard}>
              <Text style={styles.devLabel}>Pro plan (dev)</Text>
              <View style={styles.devSegment}>
                <TouchableOpacity
                  style={[
                    styles.devOption,
                    devProOverride === true && styles.devOptionActive,
                  ]}
                  onPress={() => setDevProOverride(true)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.devOptionText,
                      devProOverride === true && styles.devOptionTextActive,
                    ]}
                  >
                    On
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.devOption,
                    devProOverride === false && styles.devOptionActive,
                  ]}
                  onPress={() => setDevProOverride(false)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.devOptionText,
                      devProOverride === false && styles.devOptionTextActive,
                    ]}
                  >
                    Off
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#444",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  title: {
    flex: 1,
    color: Colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  planBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  planBadge: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 12,
  },
  planBadgeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  planDescription: {
    flex: 1,
    color: Colors.icon,
    fontSize: 14,
  },
  primaryButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.activeIcon,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonIcon: {
    marginRight: 8,
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  tipIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  tipText: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  devCard: {
    backgroundColor: "#1f1f1f",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    padding: 16,
    marginTop: 8,
  },
  devLabel: {
    color: Colors.icon,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  devSegment: {
    flexDirection: "row",
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 4,
  },
  devOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  devOptionActive: {
    backgroundColor: Colors.activeIcon,
  },
  devOptionText: {
    color: Colors.icon,
    fontSize: 14,
    fontWeight: "600",
  },
  devOptionTextActive: {
    color: "#000",
  },
});

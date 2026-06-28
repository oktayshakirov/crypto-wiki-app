import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
  Alert,
  ActionSheetIOS,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as MailComposer from "expo-mail-composer";
import * as StoreReview from "expo-store-review";
import * as Clipboard from "expo-clipboard";
import * as Device from "expo-device";
import Constants from "expo-constants";

// ── Config ──────────────────────────────────────────────────────────────────────
const CONTACT_EMAIL = "contact@thecrypto.wiki";
const APP_NAME = "Crypto Wiki";
const APP_STORE_ID = "6742765176";
const ANDROID_PACKAGE = "com.shadev.thecryptowiki";
const SOCIAL = {
  tiktok: "https://www.tiktok.com/@thecrypto.wiki",
  instagram: "https://www.instagram.com/thecrypto.wiki",
  telegram: "https://t.me/thecryptowiki",
  facebook: "https://www.facebook.com/thecryptowiki",
  twitter: "https://x.com/TheCrypto_Wiki",
};
// ──────────────────────────────────────────────────────────────────────────────

const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;
const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
const STORE_URL = Platform.OS === "ios" ? APP_STORE_URL : PLAY_STORE_URL;

const RATED_KEY = "hasRatedApp";

interface ConnectModalProps {
  visible: boolean;
  onClose: () => void;
}

function getAppVersion() {
  return Constants.expoConfig?.version ?? "Unknown";
}

async function getDeviceInfo() {
  const model = Device.modelName ?? "Unknown";
  const os = `${Device.osName ?? "Unknown"} ${Device.osVersion ?? ""}`.trim();
  return { model, os };
}

async function sendMail(subject: string, body: string) {
  const encoded = {
    subject: encodeURIComponent(subject),
    body: encodeURIComponent(body),
    to: encodeURIComponent(CONTACT_EMAIL),
  };

  if (Platform.OS === "android") {
    await Linking.openURL(
      `mailto:${CONTACT_EMAIL}?subject=${encoded.subject}&body=${encoded.body}`
    );
    return;
  }

  // iOS — detect installed mail clients
  const gmail = `googlegmail:///co?to=${encoded.to}&subject=${encoded.subject}&body=${encoded.body}`;
  const outlook = `ms-outlook://compose?to=${encoded.to}&subject=${encoded.subject}&body=${encoded.body}`;

  const [hasGmail, hasOutlook, hasAppleMail] = await Promise.all([
    Linking.canOpenURL("googlegmail://"),
    Linking.canOpenURL("ms-outlook://"),
    MailComposer.isAvailableAsync(),
  ]);

  const options: Array<{ label: string; open: () => Promise<void> }> = [];
  if (hasGmail)
    options.push({ label: "Gmail", open: () => Linking.openURL(gmail) });
  if (hasOutlook)
    options.push({ label: "Outlook", open: () => Linking.openURL(outlook) });
  if (hasAppleMail)
    options.push({
      label: "Mail",
      open: () =>
        MailComposer.composeAsync({
          recipients: [CONTACT_EMAIL],
          subject,
          body,
        }).then(() => {}),
    });

  if (options.length === 0) {
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encoded.subject}&body=${encoded.body}`;
    const canMail = await Linking.canOpenURL(mailto);
    if (canMail) {
      await Linking.openURL(mailto);
      return;
    }
    Alert.alert(
      "No mail app found",
      `Copy our email address and paste it in your mail app:\n\n${CONTACT_EMAIL}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Copy Address",
          onPress: () => Clipboard.setStringAsync(CONTACT_EMAIL),
        },
      ]
    );
    return;
  }

  if (options.length === 1) {
    await options[0].open();
    return;
  }

  ActionSheetIOS.showActionSheetWithOptions(
    {
      title: "Open with…",
      options: [...options.map((o) => o.label), "Cancel"],
      cancelButtonIndex: options.length,
    },
    (idx) => {
      if (idx < options.length) options[idx].open().catch(() => {});
    }
  );
}

async function handleReportBug() {
  const version = getAppVersion();
  const { model, os } = await getDeviceInfo();
  const body = `Describe the bug:\n\n\nSteps to reproduce:\n1.\n2.\n3.\n\n--- App info ---\nVersion: ${version}\nDevice: ${model}\nOS: ${os}`;
  await sendMail(`[${APP_NAME}] Bug Report`, body);
}

async function handleSuggestFeature() {
  const body = `What feature would you like?\n\n\nWhy would it be useful?\n\n`;
  await sendMail(`[${APP_NAME}] Feature Request`, body);
}

async function handleWorkWithUs() {
  const body = `Hi,\n\nI'd like to explore a partnership opportunity:\n\n\nAbout me / my company:\n\n`;
  await sendMail(`[${APP_NAME}] Partnership Inquiry`, body);
}

async function handleRateApp() {
  const hasRated = await AsyncStorage.getItem(RATED_KEY);
  if (hasRated) {
    Alert.alert("Thanks for your support! 🎉", undefined, [
      { text: "Close", style: "cancel" },
      { text: "Open Store", onPress: () => Linking.openURL(STORE_URL) },
    ]);
    return;
  }
  const isAvailable = await StoreReview.isAvailableAsync();
  if (isAvailable) {
    await StoreReview.requestReview();
    await AsyncStorage.setItem(RATED_KEY, "true");
  } else {
    Linking.openURL(STORE_URL);
  }
}

function openSocial(url: string, name: string) {
  if (!url) {
    Alert.alert(`${name} coming soon!`);
    return;
  }
  Linking.openURL(url);
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function Row({
  icon,
  label,
  onPress,
  iconColor,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  iconColor?: string;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Ionicons
        name={icon}
        size={20}
        color={iconColor ?? Colors.activeIcon}
        style={styles.rowIcon}
      />
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="open-outline" size={16} color={Colors.icon} />
    </TouchableOpacity>
  );
}

export default function ConnectModal({ visible, onClose }: ConnectModalProps) {
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
          <Text style={styles.title}>Connect with Us</Text>
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
          <SectionLabel label="FEEDBACK" />
          <View style={styles.card}>
            <Row
              icon="bug-outline"
              label="Report a Bug"
              onPress={handleReportBug}
            />
            <View style={styles.divider} />
            <Row
              icon="bulb-outline"
              label="Suggest a Feature"
              onPress={handleSuggestFeature}
            />
            <View style={styles.divider} />
            <Row
              icon="star-outline"
              label={`Rate ${APP_NAME}`}
              onPress={handleRateApp}
              iconColor="#FFD700"
            />
          </View>

          <SectionLabel label="COMMUNITY" />
          <View style={styles.card}>
            <Row
              icon="logo-tiktok"
              label="Follow on TikTok"
              onPress={() => openSocial(SOCIAL.tiktok, "TikTok")}
              iconColor={Colors.text}
            />
            <View style={styles.divider} />
            <Row
              icon="logo-instagram"
              label="Follow on Instagram"
              onPress={() => openSocial(SOCIAL.instagram, "Instagram")}
              iconColor="#E1306C"
            />
            <View style={styles.divider} />
            <Row
              icon="paper-plane-outline"
              label="Join us on Telegram"
              onPress={() => openSocial(SOCIAL.telegram, "Telegram")}
              iconColor="#229ED9"
            />
            <View style={styles.divider} />
            <Row
              icon="logo-facebook"
              label="Follow on Facebook"
              onPress={() => openSocial(SOCIAL.facebook, "Facebook")}
              iconColor="#1877F2"
            />
            <View style={styles.divider} />
            <Row
              icon="logo-twitter"
              label="Follow on Twitter / X"
              onPress={() => openSocial(SOCIAL.twitter, "Twitter / X")}
              iconColor={Colors.text}
            />
          </View>

          <SectionLabel label="BUSINESS" />
          <View style={styles.card}>
            <Row
              icon="briefcase-outline"
              label="Work with Us"
              onPress={handleWorkWithUs}
            />
          </View>
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
    paddingTop: 8,
    paddingBottom: 12,
  },
  sectionLabel: {
    color: Colors.icon,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
  },
  card: {
    backgroundColor: "#222",
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowIcon: {
    marginRight: 14,
    width: 22,
  },
  rowLabel: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#333",
    marginLeft: 52,
  },
});

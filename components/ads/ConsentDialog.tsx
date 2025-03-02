import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from "react-native";
import * as TrackingTransparency from "expo-tracking-transparency";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/Colors";

type ConsentDialogProps = {
  onConsentCompleted: () => void;
};

const ConsentDialog = ({ onConsentCompleted }: ConsentDialogProps) => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  useEffect(() => {
    AsyncStorage.getItem("trackingConsent").then((storedConsent) => {
      if (storedConsent === null) {
        setModalVisible(true);
      } else {
        onConsentCompleted();
      }
    });
  }, []);

  const handleAllow = async () => {
    await AsyncStorage.setItem("trackingConsent", "granted");
    setModalVisible(false);
    if (Platform.OS === "ios") {
      const { status } =
        await TrackingTransparency.requestTrackingPermissionsAsync();
      console.log("Tracking permission status:", status);
    }
    onConsentCompleted();
  };

  const handleDontAllow = async () => {
    await AsyncStorage.setItem("trackingConsent", "denied");
    setModalVisible(false);
    onConsentCompleted();
  };

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Dear User</Text>
          <Text style={styles.message}>
            To keep TheCrypto.wiki free and provide you with the best
            experience, we rely on personalized ads and push notifications. Our
            partners will collect data which means you’ll see ads that match
            your interests, while enabling notifications keeps you updated with
            every new post or sound we add. Your privacy is our priority and
            your data is handled securely.
          </Text>
          <View style={styles.buttonContainer}>
            {Platform.OS === "android" ? (
              <>
                <TouchableOpacity
                  onPress={handleDontAllow}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>Don't Allow</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAllow} style={styles.button}>
                  <Text style={[styles.buttonText, styles.agreeButton]}>
                    Allow
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={handleAllow} style={styles.button}>
                <Text style={[styles.buttonText, styles.continueButton]}>
                  Continue
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: Colors.background,
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: Colors.text,
    textAlign: "center",
  },
  message: {
    marginBottom: 15,
    fontSize: 16,
    color: Colors.text,
    textAlign: "left",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  buttonText: {
    fontSize: 16,
    color: Colors.highlight,
  },
  continueButton: {
    fontWeight: "bold",
  },
  agreeButton: {
    fontWeight: "bold",
  },
});

export default ConsentDialog;

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";
import MaterialIcons from "@expo/vector-icons/Fontisto";
import { useOnboarding } from "@/contexts/OnboardingContext";

const { width, height } = Dimensions.get("window");

export default function OnboardingScreen() {
  const {
    isOnboardingActive,
    currentStep,
    totalSteps,
    nextStep,
    previousStep,
    completeOnboarding,
    skipOnboarding,
    getCurrentStepData,
  } = useOnboarding();

  const stepData = getCurrentStepData();

  if (!isOnboardingActive || !stepData) return null;

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const getStepIcon = () => {
    switch (stepData.id) {
      case "welcome":
        return "check";
      case "portfolio":
        return "dollar";
      case "save-content":
        return "download";
      case "posts":
        return "quote-a-left";
      case "exchanges":
        return "bitcoin";
      case "ogs":
        return "persons";
      case "tools":
        return "player-settings";
      default:
        return "bitcoin";
    }
  };

  const getStepColor = () => {
    return Colors.highlight;
  };

  return (
    <View style={styles.overlay}>
      <SafeAreaView
        style={styles.container}
        edges={["top", "bottom", "left", "right"]}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require("@/assets/images/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <TouchableOpacity
              onPress={skipOnboarding}
              style={styles.skipButton}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.mainContent}>
            <View style={styles.iconContainer}>
              <View
                style={[
                  styles.iconBackground,
                  { backgroundColor: getStepColor() },
                ]}
              >
                <MaterialIcons name={getStepIcon()} size={60} color="#000" />
              </View>
            </View>

            <Text style={styles.title}>{stepData.title}</Text>
            <Text style={styles.description}>{stepData.description}</Text>

            <View style={styles.progressContainer}>
              {Array.from({ length: totalSteps }, (_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor:
                        index <= currentStep ? getStepColor() : "#333",
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.navigationContainer}>
            <View style={styles.buttonRow}>
              {!isFirstStep && (
                <TouchableOpacity
                  onPress={previousStep}
                  style={styles.secondaryButton}
                >
                  <MaterialIcons
                    name="angle-left"
                    size={20}
                    color={Colors.text}
                  />
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={isLastStep ? completeOnboarding : nextStep}
                style={[
                  styles.primaryButton,
                  { backgroundColor: getStepColor() },
                  isFirstStep && styles.fullWidthButton,
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  {isLastStep ? "Get Started" : "Next"}
                </Text>
                {!isLastStep && (
                  <MaterialIcons name="angle-right" size={20} color="#000" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.stepCounter}>
            <Text style={styles.stepText}>
              {currentStep + 1} of {totalSteps}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    zIndex: 10000,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 30,
  },
  logoContainer: {
    flex: 1,
  },
  logo: {
    width: 200,
    height: 40,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    color: Colors.icon,
    fontSize: 16,
    fontWeight: "500",
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 36,
  },
  description: {
    fontSize: 18,
    color: Colors.icon,
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 6,
  },
  navigationContainer: {
    paddingBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fullWidthButton: {
    flex: 1,
  },
  primaryButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.text,
    flex: 1,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  stepCounter: {
    alignItems: "center",
    paddingBottom: 20,
  },
  stepText: {
    color: Colors.icon,
    fontSize: 14,
    fontWeight: "500",
  },
});

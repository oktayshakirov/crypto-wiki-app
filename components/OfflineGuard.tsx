import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import OfflineScreen from "./OfflineScreen";
import { useSegments } from "expo-router";
import { useLoader } from "@/contexts/LoaderContext";
import { setMarkAsOfflineCallback } from "@/utils/networkErrorHandler";

interface OfflineGuardProps {
  children: React.ReactNode;
  showOfflineScreen?: boolean;
}

export default function OfflineGuard({
  children,
  showOfflineScreen = true,
}: OfflineGuardProps) {
  const { isOffline, isLoading, manualCheck, markAsOffline } =
    useNetworkStatus();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const segments = useSegments();
  const { hideLoader } = useLoader();

  useEffect(() => {
    setMarkAsOfflineCallback(markAsOffline);
  }, [markAsOffline]);

  useEffect(() => {
    if (isOffline) {
      hideLoader();
    }
  }, [isOffline, hideLoader]);

  if (isOffline) {
    hideLoader();
  }

  useEffect(() => {
    if (isOffline) {
      hideLoader();
    }
  }, [segments, isOffline, hideLoader]);

  const handleRetry = () => {
    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);
    manualCheck();
    setTimeout(() => setIsRetrying(false), 500);
  };

  const isInSavedContent = segments.some(
    (segment) => segment === "saved-content"
  );
  if (isOffline) {
    if (showOfflineScreen && !isInSavedContent) {
      return (
        <View style={styles.overlayContainer}>
          {children}
          <OfflineScreen
            onRetry={handleRetry}
            isRetrying={isRetrying}
            key={retryCount}
          />
        </View>
      );
    }
    return <>{children}</>;
  }

  if (isLoading) {
    return <View style={styles.loadingContainer} />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  overlayContainer: {
    flex: 1,
    position: "relative",
  },
});

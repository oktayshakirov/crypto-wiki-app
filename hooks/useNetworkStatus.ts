import { useState, useEffect, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<number>(Date.now());

  const applyState = useCallback((state: NetInfoState) => {
    // Treat the connection as offline only when the OS reports there is
    // definitively no connection. `isInternetReachable` can be null (unknown)
    // or briefly false right after the app returns from the background, so we
    // must NOT use it on its own to flag offline — that was causing the app to
    // flash the offline screen for a couple of seconds on resume.
    const connected =
      state.isConnected === true && state.isInternetReachable !== false;

    setIsConnected(connected);
    setLastCheck(Date.now());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Event-driven connectivity updates from the OS (no polling).
    const unsubscribe = NetInfo.addEventListener(applyState);

    // Prime the initial state.
    NetInfo.fetch().then(applyState);

    // When the app comes back to the foreground, re-check immediately so we
    // reflect the real state instead of a stale one. NetInfo.fetch() will not
    // flip us to offline unless the OS truly reports no connection.
    const appStateSub = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          NetInfo.fetch().then(applyState);
        }
      }
    );

    return () => {
      unsubscribe();
      appStateSub.remove();
    };
  }, [applyState]);

  const isOffline = isConnected === false;

  const manualCheck = () => {
    setIsLoading(true);
    NetInfo.fetch().then(applyState);
  };

  const markAsOffline = () => {
    setIsConnected(false);
    setLastCheck(Date.now());
    setIsLoading(false);
  };

  return {
    isConnected,
    isOffline,
    isLoading,
    lastCheck,
    manualCheck,
    markAsOffline,
  };
};

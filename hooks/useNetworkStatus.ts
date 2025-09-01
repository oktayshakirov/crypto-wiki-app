import { useState, useEffect } from "react";

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<number>(Date.now());

  const checkNetworkStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch("https://www.google.com/favicon.ico", {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-cache",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setIsConnected(true);
      setLastCheck(Date.now());
    } catch (error) {
      setIsConnected(false);
      setLastCheck(Date.now());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkNetworkStatus();

    const interval = setInterval(checkNetworkStatus, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const isOffline = isConnected === false;

  const manualCheck = () => {
    setIsLoading(true);
    checkNetworkStatus();
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

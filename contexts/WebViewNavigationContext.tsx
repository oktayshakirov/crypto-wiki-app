import React, { createContext, useContext, useState, ReactNode } from "react";

interface WebViewNavigationContextType {
  navigateToUrl: (url: string, targetTab?: string) => void;
  pendingNavigation: { url: string; targetTab?: string } | null;
  clearPendingNavigation: () => void;
}

const WebViewNavigationContext = createContext<
  WebViewNavigationContextType | undefined
>(undefined);

interface WebViewNavigationProviderProps {
  children: ReactNode;
}

export function WebViewNavigationProvider({
  children,
}: WebViewNavigationProviderProps) {
  const [pendingNavigation, setPendingNavigation] = useState<{
    url: string;
    targetTab?: string;
  } | null>(null);

  const navigateToUrl = (url: string, targetTab?: string) => {
    setPendingNavigation({ url, targetTab });
  };

  const clearPendingNavigation = () => {
    setPendingNavigation(null);
  };

  return (
    <WebViewNavigationContext.Provider
      value={{
        navigateToUrl,
        pendingNavigation,
        clearPendingNavigation,
      }}
    >
      {children}
    </WebViewNavigationContext.Provider>
  );
}

export function useWebViewNavigation() {
  const context = useContext(WebViewNavigationContext);
  if (context === undefined) {
    throw new Error(
      "useWebViewNavigation must be used within a WebViewNavigationProvider"
    );
  }
  return context;
}

import React, { createContext, useContext, useRef, ReactNode } from "react";
import { WebView } from "react-native-webview";

interface WebViewContextType {
  registerWebView: (id: string, ref: React.RefObject<WebView>) => void;
  unregisterWebView: (id: string) => void;
  getWebViewRef: (id: string) => React.RefObject<WebView> | null;
  extractCurrentPageHTML: () => Promise<string | null>;
}

const WebViewContext = createContext<WebViewContextType | undefined>(undefined);

interface WebViewProviderProps {
  children: ReactNode;
}

export function WebViewProvider({ children }: WebViewProviderProps) {
  const webViewRefs = useRef<Map<string, React.RefObject<WebView>>>(new Map());

  const registerWebView = (id: string, ref: React.RefObject<WebView>) => {
    webViewRefs.current.set(id, ref);
  };

  const unregisterWebView = (id: string) => {
    webViewRefs.current.delete(id);
  };

  const getWebViewRef = (id: string) => {
    return webViewRefs.current.get(id) || null;
  };

  const extractCurrentPageHTML = async (): Promise<string | null> => {
    try {
      const firstWebView = webViewRefs.current.values().next().value;

      if (firstWebView?.current) {
        return `
          <html>
            <head>
              <title>Page Content</title>
              <meta name="description" content="Content saved for offline viewing" />
            </head>
            <body>
              <h1>Page Content</h1>
              <p>Content saved for offline viewing</p>
            </body>
          </html>
        `;
      }

      return null;
    } catch {
      return null;
    }
  };

  return (
    <WebViewContext.Provider
      value={{
        registerWebView,
        unregisterWebView,
        getWebViewRef,
        extractCurrentPageHTML,
      }}
    >
      {children}
    </WebViewContext.Provider>
  );
}

export function useWebView() {
  const context = useContext(WebViewContext);
  if (context === undefined) {
    throw new Error("useWebView must be used within a WebViewProvider");
  }
  return context;
}

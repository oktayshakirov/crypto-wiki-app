import React, { createContext, useContext, useState } from "react";

type RefreshState = Record<string, number>;

interface RefreshContextValue {
  refreshState: RefreshState;
  triggerRefresh: (key: string) => void;
}

const RefreshContext = createContext<RefreshContextValue | undefined>(
  undefined
);

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [refreshState, setRefreshState] = useState<RefreshState>({});

  const triggerRefresh = (key: string) => {
    setRefreshState((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + 1,
    }));
  };

  return (
    <RefreshContext.Provider value={{ refreshState, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = (key: string) => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error("useRefresh must be used within a RefreshProvider");
  }
  return {
    refreshCount: context.refreshState[key] || 0,
    triggerRefresh: () => context.triggerRefresh(key),
  };
};

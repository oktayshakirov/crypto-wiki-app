import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { AppState } from "react-native";
import {
  PortfolioAsset,
  PortfolioSummary,
  PortfolioStorage,
} from "@/utils/portfolioStorage";
import { PortfolioAPI } from "@/utils/portfolioAPI";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface PortfolioContextType {
  assets: PortfolioAsset[];
  summary: PortfolioSummary | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Asset management
  addAsset: (
    symbol: string,
    amount: number,
    purchasePrice?: number
  ) => Promise<boolean>;
  updateAsset: (
    id: string,
    updates: Partial<PortfolioAsset>
  ) => Promise<boolean>;
  removeAsset: (id: string) => Promise<boolean>;

  // Data operations
  refreshPortfolio: () => Promise<void>;
  loadPortfolio: () => Promise<void>;
  clearError: () => void;

  // Utility
  getAssetById: (id: string) => PortfolioAsset | undefined;
  getTotalValue: () => number;
  getTotalProfitLoss: () => { amount: number; percentage: number };
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(
  undefined
);

interface PortfolioProviderProps {
  children: React.ReactNode;
}

export function PortfolioProvider({ children }: PortfolioProviderProps) {
  const [assets, setAssets] = useState<PortfolioAsset[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isOffline } = useNetworkStatus();

  useEffect(() => {
    loadPortfolio();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active" && !isOffline) {
        refreshPortfolio();
      }
    });

    return () => subscription.remove();
  }, [isOffline]);

  const loadPortfolio = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [storedAssets, storedSummary] = await Promise.all([
        PortfolioStorage.getAllAssets(),
        PortfolioStorage.getSummary(),
      ]);

      setAssets(storedAssets);
      setSummary(storedSummary);

      if (storedAssets.length > 0 && !isOffline) {
        refreshPortfolio();
      }
    } catch (err) {
      setError("Failed to load portfolio");
    } finally {
      setIsLoading(false);
    }
  }, [isOffline]);

  const refreshPortfolio = useCallback(async () => {
    if (isOffline) return;

    setIsRefreshing(true);
    setError(null);

    try {
      const currentAssets = await PortfolioStorage.getAllAssets();
      if (currentAssets.length === 0) {
        setIsRefreshing(false);
        return;
      }

      PortfolioAPI.clearCache();

      const symbols = currentAssets.map((asset) => asset.symbol);
      const prices = await PortfolioAPI.getMultiplePrices(symbols);

      await PortfolioStorage.updateAssetPrices(prices);

      const updatedAssets = await PortfolioStorage.getAllAssets();
      const newSummary = await PortfolioStorage.calculateSummary(updatedAssets);

      setAssets(updatedAssets);
      setSummary(newSummary);
    } catch (err) {
      setError("Failed to refresh prices");
    } finally {
      setIsRefreshing(false);
    }
  }, [isOffline]);

  const addAsset = useCallback(
    async (
      symbol: string,
      amount: number,
      purchasePrice?: number
    ): Promise<boolean> => {
      setError(null);

      try {
        let currentPrice = 0;
        let finalPurchasePrice = purchasePrice || 0;

        if (!isOffline) {
          try {
            currentPrice = await PortfolioAPI.getCurrentPrice(symbol);
            if (!purchasePrice) {
              finalPurchasePrice = currentPrice;
            }
          } catch (err) {
            if (!purchasePrice) {
              setError(
                "Unable to fetch current price. Please enter purchase price manually."
              );
              return false;
            }
          }
        } else if (!purchasePrice) {
          setError("Purchase price is required when offline");
          return false;
        }

        const newAsset: PortfolioAsset = {
          id: PortfolioStorage.generateAssetId(),
          symbol: symbol.toUpperCase(),
          name: symbol.toUpperCase(),
          amount,
          purchasePrice: finalPurchasePrice,
          currentPrice: currentPrice || finalPurchasePrice,
          lastUpdated: Date.now(),
          dateAdded: new Date().toISOString(),
        };

        await PortfolioStorage.saveAsset(newAsset);
        await loadPortfolio();

        return true;
      } catch (err) {
        setError("Failed to add asset");
        return false;
      }
    },
    [isOffline, loadPortfolio]
  );

  const updateAsset = useCallback(
    async (id: string, updates: Partial<PortfolioAsset>): Promise<boolean> => {
      setError(null);

      try {
        const existingAsset = await PortfolioStorage.getAssetById(id);
        if (!existingAsset) {
          setError("Asset not found");
          return false;
        }

        const updatedAsset: PortfolioAsset = {
          ...existingAsset,
          ...updates,
          lastUpdated: Date.now(),
        };

        await PortfolioStorage.saveAsset(updatedAsset);
        await loadPortfolio();

        return true;
      } catch (err) {
        setError("Failed to update asset");
        return false;
      }
    },
    [loadPortfolio]
  );

  const removeAsset = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);

      try {
        const success = await PortfolioStorage.removeAsset(id);
        if (success) {
          await loadPortfolio();
        }
        return success;
      } catch (err) {
        setError("Failed to remove asset");
        return false;
      }
    },
    [loadPortfolio]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getAssetById = useCallback(
    (id: string): PortfolioAsset | undefined => {
      return assets.find((asset) => asset.id === id);
    },
    [assets]
  );

  const getTotalValue = useCallback((): number => {
    return assets.reduce((total, asset) => {
      return total + asset.amount * asset.currentPrice;
    }, 0);
  }, [assets]);

  const getTotalProfitLoss = useCallback((): {
    amount: number;
    percentage: number;
  } => {
    const totalValue = getTotalValue();
    const totalInvested = assets.reduce((total, asset) => {
      return total + asset.amount * asset.purchasePrice;
    }, 0);

    const amount = totalValue - totalInvested;
    const percentage = totalInvested > 0 ? (amount / totalInvested) * 100 : 0;

    return { amount, percentage };
  }, [assets, getTotalValue]);

  const value: PortfolioContextType = {
    assets,
    summary,
    isLoading,
    isRefreshing,
    error,
    addAsset,
    updateAsset,
    removeAsset,
    refreshPortfolio,
    loadPortfolio,
    clearError,
    getAssetById,
    getTotalValue,
    getTotalProfitLoss,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio(): PortfolioContextType {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
}

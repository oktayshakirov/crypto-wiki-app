import { useState, useEffect, useCallback, useRef } from "react";
import { WatchlistItem, WatchlistStorage } from "@/utils/watchlistStorage";
import { PortfolioAPI } from "@/utils/portfolioAPI";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export interface WatchlistState {
  items: WatchlistItem[];
  isRefreshing: boolean;
  addToWatchlist: (symbol: string) => Promise<void>;
  removeFromWatchlist: (symbol: string) => Promise<void>;
  refreshWatchlist: () => Promise<void>;
}

export function useWatchlist(): WatchlistState {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isOffline } = useNetworkStatus();
  const isOfflineRef = useRef(isOffline);
  isOfflineRef.current = isOffline;

  const refreshMarketData = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0 || isOfflineRef.current) return;

    try {
      const tickers = await PortfolioAPI.getMarketTickers(symbols);
      if (tickers.size > 0) {
        const updated = await WatchlistStorage.updateMarketData(tickers);
        setItems(updated);
      }
    } catch (error) {
      // Keep last known values - the list renders cached data.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    WatchlistStorage.getAll().then((stored) => {
      if (cancelled) return;
      setItems(stored);
      refreshMarketData(stored.map((item) => item.symbol));
    });

    return () => {
      cancelled = true;
    };
  }, [refreshMarketData]);

  const addToWatchlist = useCallback(
    async (symbol: string) => {
      const updated = await WatchlistStorage.add(symbol);
      setItems(updated);
      await refreshMarketData([symbol.toUpperCase()]);
    },
    [refreshMarketData]
  );

  const removeFromWatchlist = useCallback(async (symbol: string) => {
    const updated = await WatchlistStorage.remove(symbol);
    setItems(updated);
  }, []);

  const refreshWatchlist = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const stored = await WatchlistStorage.getAll();
      await refreshMarketData(stored.map((item) => item.symbol));
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshMarketData]);

  return {
    items,
    isRefreshing,
    addToWatchlist,
    removeFromWatchlist,
    refreshWatchlist,
  };
}

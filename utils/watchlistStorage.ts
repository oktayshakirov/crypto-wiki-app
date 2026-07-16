import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCoinName } from "@/utils/coinNames";

export interface WatchlistItem {
  symbol: string;
  name: string;
  dateAdded: string;
  // Last fetched market data, kept so the list still renders offline.
  lastPrice: number | null;
  lastChangePercent24h: number | null;
}

export class WatchlistStorage {
  private static readonly WATCHLIST_KEY = "watchlist_items";

  static async getAll(): Promise<WatchlistItem[]> {
    try {
      const data = await AsyncStorage.getItem(this.WATCHLIST_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  static async add(symbol: string): Promise<WatchlistItem[]> {
    const upper = symbol.toUpperCase();
    const items = await this.getAll();
    if (items.some((item) => item.symbol === upper)) {
      return items;
    }

    const updated = [
      ...items,
      {
        symbol: upper,
        name: getCoinName(upper),
        dateAdded: new Date().toISOString(),
        lastPrice: null,
        lastChangePercent24h: null,
      },
    ];
    await this.saveAll(updated);
    return updated;
  }

  static async remove(symbol: string): Promise<WatchlistItem[]> {
    const items = await this.getAll();
    const updated = items.filter((item) => item.symbol !== symbol);
    await this.saveAll(updated);
    return updated;
  }

  static async updateMarketData(
    tickers: Map<string, { price: number; changePercent24h: number }>
  ): Promise<WatchlistItem[]> {
    const items = await this.getAll();
    const updated = items.map((item) => {
      const ticker = tickers.get(item.symbol);
      if (!ticker) return item;
      return {
        ...item,
        lastPrice: ticker.price,
        lastChangePercent24h: ticker.changePercent24h,
      };
    });
    await this.saveAll(updated);
    return updated;
  }

  private static async saveAll(items: WatchlistItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.WATCHLIST_KEY, JSON.stringify(items));
    } catch (error) {
      throw new Error("Failed to save watchlist");
    }
  }
}

import AsyncStorage from "@react-native-async-storage/async-storage";

export interface HistoryPoint {
  t: number; // timestamp (ms)
  v: number; // total portfolio value (USD)
}

export class PortfolioHistory {
  private static readonly HISTORY_KEY = "portfolio_history";
  private static readonly MAX_POINTS = 1000;
  // Points closer together than this replace the previous one instead of
  // appending, so frequent refreshes don't flood the history.
  private static readonly MIN_INTERVAL = 30 * 60 * 1000;

  static async getHistory(): Promise<HistoryPoint[]> {
    try {
      const data = await AsyncStorage.getItem(this.HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  static async record(
    totalValue: number,
    timestamp: number = Date.now()
  ): Promise<HistoryPoint[]> {
    try {
      const points = await this.getHistory();
      const last = points[points.length - 1];

      if (last && timestamp <= last.t) {
        return points;
      }

      if (last && timestamp - last.t < this.MIN_INTERVAL) {
        points[points.length - 1] = { t: timestamp, v: totalValue };
      } else {
        points.push({ t: timestamp, v: totalValue });
      }

      const trimmed = points.slice(-this.MAX_POINTS);
      await AsyncStorage.setItem(this.HISTORY_KEY, JSON.stringify(trimmed));
      return trimmed;
    } catch (error) {
      return [];
    }
  }

  static async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.HISTORY_KEY);
    } catch (error) {
      // Nothing to do - history is best-effort.
    }
  }
}

import AsyncStorage from "@react-native-async-storage/async-storage";

export interface PortfolioAsset {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  purchasePrice: number;
  currentPrice: number;
  lastUpdated: number;
  dateAdded: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  lastUpdated: number;
  assetsCount: number;
}

export class PortfolioStorage {
  private static readonly PORTFOLIO_KEY = "portfolio_assets";
  private static readonly SUMMARY_KEY = "portfolio_summary";

  static async saveAsset(asset: PortfolioAsset): Promise<void> {
    try {
      const assets = await this.getAllAssets();
      const existingIndex = assets.findIndex((a) => a.id === asset.id);

      if (existingIndex >= 0) {
        assets[existingIndex] = asset;
      } else {
        assets.push(asset);
      }

      await AsyncStorage.setItem(this.PORTFOLIO_KEY, JSON.stringify(assets));
    } catch (error) {
      throw new Error("Failed to save portfolio asset");
    }
  }

  static async getAllAssets(): Promise<PortfolioAsset[]> {
    try {
      const data = await AsyncStorage.getItem(this.PORTFOLIO_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  static async getAssetById(id: string): Promise<PortfolioAsset | null> {
    try {
      const assets = await this.getAllAssets();
      return assets.find((asset) => asset.id === id) || null;
    } catch (error) {
      return null;
    }
  }

  static async removeAsset(id: string): Promise<boolean> {
    try {
      const assets = await this.getAllAssets();
      const filteredAssets = assets.filter((asset) => asset.id !== id);
      await AsyncStorage.setItem(
        this.PORTFOLIO_KEY,
        JSON.stringify(filteredAssets)
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  static async updateAssetPrices(prices: Map<string, number>): Promise<void> {
    try {
      const assets = await this.getAllAssets();
      const updateTimestamp = Date.now();
      const updatedAssets = assets.map((asset) => ({
        ...asset,
        currentPrice: prices.get(asset.symbol) || asset.currentPrice,
        lastUpdated: updateTimestamp,
      }));

      await AsyncStorage.setItem(
        this.PORTFOLIO_KEY,
        JSON.stringify(updatedAssets)
      );
    } catch (error) {
      throw new Error("Failed to update asset prices");
    }
  }

  static async saveSummary(summary: PortfolioSummary): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SUMMARY_KEY, JSON.stringify(summary));
    } catch (error) {
      throw new Error("Failed to save portfolio summary");
    }
  }

  static async getSummary(): Promise<PortfolioSummary | null> {
    try {
      const data = await AsyncStorage.getItem(this.SUMMARY_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  static async calculateSummary(
    assets?: PortfolioAsset[]
  ): Promise<PortfolioSummary> {
    try {
      const portfolioAssets = assets || (await this.getAllAssets());

      let totalValue = 0;
      let totalInvested = 0;

      portfolioAssets.forEach((asset) => {
        const assetValue = asset.amount * asset.currentPrice;
        const assetInvested = asset.amount * asset.purchasePrice;

        totalValue += assetValue;
        totalInvested += assetInvested;
      });

      const totalProfitLoss = totalValue - totalInvested;
      const totalProfitLossPercent =
        totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

      const summary: PortfolioSummary = {
        totalValue,
        totalInvested,
        totalProfitLoss,
        totalProfitLossPercent,
        lastUpdated: Date.now(),
        assetsCount: portfolioAssets.length,
      };

      await this.saveSummary(summary);
      return summary;
    } catch (error) {
      throw new Error("Failed to calculate portfolio summary");
    }
  }

  static async clearPortfolio(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.PORTFOLIO_KEY);
      await AsyncStorage.removeItem(this.SUMMARY_KEY);
    } catch (error) {
      throw new Error("Failed to clear portfolio");
    }
  }

  static generateAssetId(): string {
    return `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export interface CoinPrice {
  symbol: string;
  price: string;
  lastUpdated: number;
}

export interface BinancePriceResponse {
  symbol: string;
  price: string;
}

export class PortfolioAPI {
  private static readonly BASE_URL = "https://api.binance.com/api/v3";
  private static readonly CACHE_DURATION = 5 * 60 * 1000;
  private static priceCache: Map<string, CoinPrice> = new Map();

  static async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const cached = this.priceCache.get(symbol.toUpperCase());
      if (cached && Date.now() - cached.lastUpdated < this.CACHE_DURATION) {
        return parseFloat(cached.price);
      }

      const tradingPair = `${symbol.toUpperCase()}USDT`;
      const response = await fetch(
        `${this.BASE_URL}/ticker/price?symbol=${tradingPair}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: BinancePriceResponse = await response.json();
      const price = parseFloat(data.price);

      this.priceCache.set(symbol.toUpperCase(), {
        symbol: symbol.toUpperCase(),
        price: data.price,
        lastUpdated: Date.now(),
      });

      return price;
    } catch (error) {
      const cached = this.priceCache.get(symbol.toUpperCase());
      if (cached) {
        return parseFloat(cached.price);
      }

      throw new Error(`Unable to fetch price for ${symbol}`);
    }
  }

  static async getMultiplePrices(
    symbols: string[]
  ): Promise<Map<string, number>> {
    const prices = new Map<string, number>();

    const pricePromises = symbols.map(async (symbol) => {
      try {
        const price = await this.getCurrentPrice(symbol);
        return { symbol: symbol.toUpperCase(), price };
      } catch (error) {
        return { symbol: symbol.toUpperCase(), price: 0 };
      }
    });

    const results = await Promise.all(pricePromises);
    results.forEach(({ symbol, price }) => {
      prices.set(symbol, price);
    });

    return prices;
  }

  static async getAvailableCoins(): Promise<string[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/exchangeInfo`);
      const data = await response.json();

      const usdtPairs = data.symbols
        .filter(
          (symbol: any) =>
            symbol.quoteAsset === "USDT" && symbol.status === "TRADING"
        )
        .map((symbol: any) => symbol.baseAsset);

      const popularCoins = [
        "BTC",
        "ETH",
        "BNB",
        "ADA",
        "DOT",
        "LINK",
        "UNI",
        "LTC",
        "BCH",
        "XRP",
      ];

      const allCoins = [...new Set([...usdtPairs, ...popularCoins])];
      return allCoins.sort();
    } catch (error) {
      return [
        "BTC",
        "ETH",
        "BNB",
        "ADA",
        "DOT",
        "LINK",
        "UNI",
        "LTC",
        "BCH",
        "XRP",
        "MATIC",
        "AVAX",
        "SOL",
      ];
    }
  }

  static clearCache(): void {
    this.priceCache.clear();
  }

  static getCachedPrice(symbol: string): number | null {
    const cached = this.priceCache.get(symbol.toUpperCase());
    return cached ? parseFloat(cached.price) : null;
  }
}

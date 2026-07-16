export interface CoinPrice {
  symbol: string;
  price: string;
  lastUpdated: number;
}

export interface BinancePriceResponse {
  symbol: string;
  price: string;
}

export interface MarketTicker {
  symbol: string;
  price: number;
  changePercent24h: number;
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

  // Symbols that fail are omitted from the result (never recorded as 0),
  // so callers keep the last known price instead of cratering the total.
  static async getMultiplePrices(
    symbols: string[]
  ): Promise<Map<string, number>> {
    const prices = new Map<string, number>();
    const uniqueSymbols = [...new Set(symbols.map((s) => s.toUpperCase()))];
    if (uniqueSymbols.length === 0) return prices;

    const now = Date.now();
    const staleSymbols = uniqueSymbols.filter((symbol) => {
      const cached = this.priceCache.get(symbol);
      if (cached && now - cached.lastUpdated < this.CACHE_DURATION) {
        prices.set(symbol, parseFloat(cached.price));
        return false;
      }
      return true;
    });

    if (staleSymbols.length === 0) return prices;

    try {
      const batch = await this.fetchBatchPrices(staleSymbols);
      batch.forEach((price, symbol) => prices.set(symbol, price));
    } catch (error) {
      // Batch endpoint rejects the whole request if any symbol is unknown;
      // fall back to individual lookups so one bad symbol can't block the rest.
      const results = await Promise.all(
        staleSymbols.map(async (symbol) => {
          try {
            return { symbol, price: await this.getCurrentPrice(symbol) };
          } catch {
            return null;
          }
        })
      );
      results.forEach((result) => {
        if (result) prices.set(result.symbol, result.price);
      });
    }

    return prices;
  }

  private static async fetchBatchPrices(
    symbols: string[]
  ): Promise<Map<string, number>> {
    const pairs = symbols.map((s) => `"${s}USDT"`).join(",");
    const response = await fetch(
      `${this.BASE_URL}/ticker/price?symbols=${encodeURIComponent(
        `[${pairs}]`
      )}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: BinancePriceResponse[] = await response.json();
    const prices = new Map<string, number>();
    const now = Date.now();

    data.forEach((item) => {
      const symbol = item.symbol.replace(/USDT$/, "");
      const price = parseFloat(item.price);
      if (!isNaN(price) && price > 0) {
        prices.set(symbol, price);
        this.priceCache.set(symbol, {
          symbol,
          price: item.price,
          lastUpdated: now,
        });
      }
    });

    return prices;
  }

  static async getMarketTickers(
    symbols: string[]
  ): Promise<Map<string, MarketTicker>> {
    const tickers = new Map<string, MarketTicker>();
    const uniqueSymbols = [...new Set(symbols.map((s) => s.toUpperCase()))];
    if (uniqueSymbols.length === 0) return tickers;

    const fetchBatch = async (batchSymbols: string[]) => {
      const pairs = batchSymbols.map((s) => `"${s}USDT"`).join(",");
      const response = await fetch(
        `${this.BASE_URL}/ticker/24hr?symbols=${encodeURIComponent(
          `[${pairs}]`
        )}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: any[] = await response.json();
      data.forEach((item) => {
        const symbol = String(item.symbol).replace(/USDT$/, "");
        const price = parseFloat(item.lastPrice);
        const changePercent24h = parseFloat(item.priceChangePercent);
        if (!isNaN(price) && price > 0) {
          tickers.set(symbol, {
            symbol,
            price,
            changePercent24h: isNaN(changePercent24h) ? 0 : changePercent24h,
          });
        }
      });
    };

    try {
      await fetchBatch(uniqueSymbols);
    } catch (error) {
      await Promise.all(
        uniqueSymbols.map(async (symbol) => {
          try {
            await fetchBatch([symbol]);
          } catch {
            // Unknown pair - leave it out.
          }
        })
      );
    }

    return tickers;
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

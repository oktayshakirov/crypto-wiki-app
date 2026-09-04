import { PortfolioAsset } from "@/utils/portfolioStorage";

export interface AllocationEntry {
  symbol: string;
  value: number;
  percent: number;
}

export interface PerformerEntry {
  symbol: string;
  profitLossPercent: number;
}

// Sorted by value, largest first.
export function computeAllocations(assets: PortfolioAsset[]): AllocationEntry[] {
  const withValue = assets.map((a) => ({
    symbol: a.symbol,
    value: a.amount * a.currentPrice,
  }));
  const total = withValue.reduce((sum, a) => sum + a.value, 0);
  if (total <= 0) return [];

  return withValue
    .map((a) => ({ ...a, percent: (a.value / total) * 100 }))
    .sort((a, b) => b.value - a.value);
}

// Ranked by %P&L, not by size - a small position can be your best performer.
// Only assets with a recorded purchase price count (avoids a divide-by-zero
// showing as a fake +/-100%).
export function computeBestWorstPerformers(assets: PortfolioAsset[]): {
  best: PerformerEntry | null;
  worst: PerformerEntry | null;
} {
  const withPL = assets
    .filter((a) => a.purchasePrice > 0)
    .map((a) => ({
      symbol: a.symbol,
      profitLossPercent:
        ((a.currentPrice - a.purchasePrice) / a.purchasePrice) * 100,
    }));

  if (withPL.length === 0) return { best: null, worst: null };

  const sorted = [...withPL].sort(
    (a, b) => b.profitLossPercent - a.profitLossPercent
  );
  return { best: sorted[0], worst: sorted[sorted.length - 1] };
}

// A simple concentration flag - not investment advice, just a nudge that
// most of the portfolio's value sits in one place.
export function diversificationNote(allocations: AllocationEntry[]): string | null {
  if (allocations.length < 2) return null;
  const top = allocations[0];
  if (top.percent >= 70) {
    return `${top.symbol} makes up ${top.percent.toFixed(0)}% of your portfolio - highly concentrated.`;
  }
  if (top.percent >= 50) {
    return `${top.symbol} makes up ${top.percent.toFixed(0)}% of your portfolio.`;
  }
  return `Your top holding (${top.symbol}) is ${top.percent.toFixed(0)}% of your portfolio - fairly balanced.`;
}

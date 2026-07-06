export function formatMoney(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${withThousands(Math.abs(value).toFixed(2))}`;
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function withThousands(numeric: string): string {
  const [whole, decimals] = numeric.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimals ? `${grouped}.${decimals}` : grouped;
}

export type HexColor = `#${string}`;

export function profitColor(value: number): HexColor {
  return value >= 0 ? "#4ade80" : "#f87171";
}

export interface FearGreedBand {
  label: string;
  smiley: string;
  from: HexColor;
  to: HexColor;
}

// Matches the website's FearAndGreedIndex bands (label, smiley, gradient).
export function fearGreedBand(value: number): FearGreedBand {
  if (value <= 20)
    return { label: "Extreme Fear", smiley: "😱", from: "#f85032", to: "#e73827" };
  if (value <= 40)
    return { label: "Fear", smiley: "😢", from: "#ff7e5f", to: "#feb47b" };
  if (value <= 60)
    return { label: "Neutral", smiley: "😐", from: "#f2c94c", to: "#f2994a" };
  if (value <= 80)
    return { label: "Greed", smiley: "🙂", from: "#a8ff78", to: "#78ffd6" };
  return { label: "Extreme Greed", smiley: "😁", from: "#56ab2f", to: "#a8e063" };
}

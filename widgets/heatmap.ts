import { HeatmapCoin } from "./types";
import { HexColor } from "./format";

// Green for gains, red for losses; deeper shade for larger moves (like the site).
export function changeColor(change: number): HexColor {
  if (change >= 3) return "#2e7d32";
  if (change >= 0) return "#4caf50";
  if (change > -3) return "#ef5350";
  return "#c62828";
}

export function formatChange(change: number): string {
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    rows.push(arr.slice(i, i + size));
  }
  return rows;
}

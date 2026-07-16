import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/Colors";
import { HistoryPoint } from "@/utils/portfolioHistory";

const RANGES = [
  { label: "24H", ms: 24 * 60 * 60 * 1000 },
  { label: "7D", ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "1M", ms: 30 * 24 * 60 * 60 * 1000 },
  { label: "ALL", ms: Infinity },
] as const;

type RangeLabel = (typeof RANGES)[number]["label"];

const MAX_BARS = 40;
const CHART_HEIGHT = 120;
const PROFIT_COLOR = "#4ade80";
const LOSS_COLOR = "#f87171";

function formatValue(value: number): string {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: value >= 1000 ? 0 : 2,
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  })}`;
}

function bucketPoints(points: HistoryPoint[]): number[] {
  if (points.length <= MAX_BARS) {
    return points.map((p) => p.v);
  }

  const buckets: number[] = [];
  const bucketSize = points.length / MAX_BARS;
  for (let i = 0; i < MAX_BARS; i++) {
    const slice = points.slice(
      Math.floor(i * bucketSize),
      Math.max(Math.floor((i + 1) * bucketSize), Math.floor(i * bucketSize) + 1)
    );
    const avg = slice.reduce((sum, p) => sum + p.v, 0) / slice.length;
    buckets.push(avg);
  }
  return buckets;
}

export default function PortfolioHistoryChart({
  history,
}: {
  history: HistoryPoint[];
}) {
  const [range, setRange] = useState<RangeLabel>("7D");

  const { bars, changeAmount, changePercent, min, max, hasData } =
    useMemo(() => {
      const rangeMs = RANGES.find((r) => r.label === range)!.ms;
      const cutoff = rangeMs === Infinity ? 0 : Date.now() - rangeMs;
      const points = history.filter((p) => p.t >= cutoff);

      if (points.length < 2) {
        return {
          bars: [] as number[],
          changeAmount: 0,
          changePercent: 0,
          min: 0,
          max: 0,
          hasData: false,
        };
      }

      const values = points.map((p) => p.v);
      const first = values[0];
      const last = values[values.length - 1];

      return {
        bars: bucketPoints(points),
        changeAmount: last - first,
        changePercent: first > 0 ? ((last - first) / first) * 100 : 0,
        min: Math.min(...values),
        max: Math.max(...values),
        hasData: true,
      };
    }, [history, range]);

  const isUp = changeAmount >= 0;
  const trendColor = isUp ? PROFIT_COLOR : LOSS_COLOR;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Performance</Text>
        {hasData && (
          <Text style={[styles.changeText, { color: trendColor }]}>
            {isUp ? "+" : "-"}
            {formatValue(Math.abs(changeAmount))} ({changePercent.toFixed(2)}
            %)
          </Text>
        )}
      </View>

      {hasData ? (
        <>
          <View style={styles.chartArea}>
            {bars.map((value, index) => {
              const span = max - min;
              const ratio = span > 0 ? (value - min) / span : 0.5;
              const height = Math.max(4, ratio * CHART_HEIGHT);
              return (
                <View
                  key={index}
                  style={[
                    styles.bar,
                    { height, backgroundColor: trendColor },
                    index === bars.length - 1 && styles.lastBar,
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.minMaxRow}>
            <Text style={styles.minMaxText}>Low {formatValue(min)}</Text>
            <Text style={styles.minMaxText}>High {formatValue(max)}</Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>
            Not enough data for this range yet. Your portfolio value is
            recorded every time prices refresh.
          </Text>
        </View>
      )}

      <View style={styles.rangeRow}>
        {RANGES.map((r) => (
          <TouchableOpacity
            key={r.label}
            style={[
              styles.rangeButton,
              range === r.label && styles.rangeButtonActive,
            ]}
            onPress={() => setRange(r.label)}
          >
            <Text
              style={[
                styles.rangeButtonText,
                range === r.label && styles.rangeButtonTextActive,
              ]}
            >
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
  },
  changeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  chartArea: {
    height: CHART_HEIGHT,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
  },
  bar: {
    flex: 1,
    borderRadius: 2,
    opacity: 0.55,
  },
  lastBar: {
    opacity: 1,
  },
  minMaxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  minMaxText: {
    fontSize: 12,
    color: Colors.icon,
  },
  emptyChart: {
    height: CHART_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  emptyChartText: {
    fontSize: 14,
    color: Colors.icon,
    textAlign: "center",
    lineHeight: 20,
  },
  rangeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 8,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#262626",
  },
  rangeButtonActive: {
    backgroundColor: Colors.activeIcon,
  },
  rangeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.icon,
  },
  rangeButtonTextActive: {
    color: "#000",
  },
});

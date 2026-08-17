import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  WIDGET_API,
  WIDGET_SNAPSHOT_KEY,
  WidgetSnapshot,
} from "@/utils/widgetBridge";
import { ContentData, DEEP_LINKS, FearGreedData, HeatmapData } from "./types";
import { PortfolioWidget } from "./PortfolioWidget";
import { FearGreedWidget } from "./FearGreedWidget";
import { LatestItemWidget } from "./LatestItemWidget";
import { HeatmapWidget } from "./HeatmapWidget";
import { HalvingWidget } from "./HalvingWidget";
import { getHalvingData } from "./halving";
import { LockedWidget } from "./LockedWidget";

const PRO_WIDGET_LABELS: Record<string, string> = {
  FearGreedWidget: "Fear & Greed",
  LatestPostWidget: "Latest Post",
  LatestExchangeWidget: "Latest Exchange",
  LatestOGWidget: "Latest OG",
  HeatmapWidget: "Crypto Heatmap",
  HalvingWidget: "Bitcoin Halving",
};

async function getSnapshot(): Promise<WidgetSnapshot> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_SNAPSHOT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { isPro: false, portfolio: null, updatedAt: 0 };
}

// Example data shown in the Portfolio widget before the app has written any real
// snapshot (i.e. freshly added from the picker / preview, app not opened yet).
const PORTFOLIO_PREVIEW: WidgetSnapshot = {
  isPro: true,
  portfolio: {
    totalValue: 12345.67,
    totalProfitLoss: 1234.56,
    totalProfitLossPercent: 11.1,
    assetsCount: 5,
  },
  updatedAt: Date.now(),
};

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function renderWidgetByName(
  name: string,
  dimensions: { width: number; height: number }
): Promise<React.ReactElement> {
  const snapshot = await getSnapshot();

  // Portfolio Value is the one widget available on the free plan;
  // all other widgets are Pro-only and show an upgrade notice.
  if (name !== "PortfolioWidget" && !snapshot.isPro) {
    return <LockedWidget widgetLabel={PRO_WIDGET_LABELS[name] ?? "This widget"} />;
  }

  switch (name) {
    case "PortfolioWidget":
      return (
        <PortfolioWidget
          snapshot={snapshot.updatedAt === 0 ? PORTFOLIO_PREVIEW : snapshot}
        />
      );

    case "FearGreedWidget": {
      const market = await fetchJson<FearGreedData>(WIDGET_API.market);
      return <FearGreedWidget market={market} />;
    }

    case "LatestPostWidget": {
      const content = await fetchJson<ContentData>(WIDGET_API.content);
      return (
        <LatestItemWidget
          label="LATEST POST"
          item={content?.latestPost ?? null}
          deepLink={DEEP_LINKS.posts}
          widthDp={dimensions?.width}
        />
      );
    }

    case "LatestExchangeWidget": {
      const content = await fetchJson<ContentData>(WIDGET_API.content);
      return (
        <LatestItemWidget
          label="LATEST EXCHANGE"
          item={content?.latestExchange ?? null}
          deepLink={DEEP_LINKS.exchanges}
          widthDp={dimensions?.width}
        />
      );
    }

    case "LatestOGWidget": {
      const content = await fetchJson<ContentData>(WIDGET_API.content);
      return (
        <LatestItemWidget
          label="LATEST OG"
          item={content?.latestOG ?? null}
          deepLink={DEEP_LINKS.ogs}
          widthDp={dimensions?.width}
        />
      );
    }

    case "HalvingWidget": {
      // No Cloud Function behind this one: the block height comes straight from
      // mempool.space, and a failed call still yields a clock estimate, so
      // there is no empty state to render.
      const halving = await getHalvingData();
      // 2x2 is roughly 110-160dp wide; anything wider is the 4x2 shape.
      return (
        <HalvingWidget
          data={halving}
          wide={(dimensions?.width ?? 0) >= 200}
          widthDp={dimensions?.width}
        />
      );
    }

    case "HeatmapWidget": {
      const heatmap = await fetchJson<HeatmapData>(WIDGET_API.heatmap);
      // Taller widget = more coins in the right grid (mirrors iOS medium/large).
      const restCount = (dimensions?.height ?? 0) >= 200 ? 10 : 4;
      return <HeatmapWidget data={heatmap} restCount={restCount} />;
    }

    default:
      return <PortfolioWidget snapshot={snapshot} />;
  }
}

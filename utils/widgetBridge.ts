import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PortfolioSummary } from "@/utils/portfolioStorage";

export const WIDGET_SNAPSHOT_KEY = "widget_snapshot";
export const APP_GROUP = "group.com.shadev.thecryptowiki";

export const WIDGET_API = {
  market: "https://us-central1-the-crypto-wiki.cloudfunctions.net/getWidgetData",
  content:
    "https://us-central1-the-crypto-wiki.cloudfunctions.net/getWidgetContent",
  heatmap:
    "https://us-central1-the-crypto-wiki.cloudfunctions.net/getWidgetHeatmap",
};

export interface WidgetSnapshot {
  isPro: boolean;
  portfolio: {
    totalValue: number;
    totalProfitLoss: number;
    totalProfitLossPercent: number;
    assetsCount: number;
  } | null;
  updatedAt: number;
}

async function readSnapshot(): Promise<WidgetSnapshot> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_SNAPSHOT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { isPro: false, portfolio: null, updatedAt: 0 };
}

async function writeSnapshot(snapshot: WidgetSnapshot): Promise<void> {
  const json = JSON.stringify(snapshot);
  await AsyncStorage.setItem(WIDGET_SNAPSHOT_KEY, json);

  if (Platform.OS === "ios") {
    try {
      const { ExtensionStorage } = require("@bacons/apple-targets");
      const storage = new ExtensionStorage(APP_GROUP);
      storage.set(WIDGET_SNAPSHOT_KEY, json);
      ExtensionStorage.reloadWidget();
    } catch {
      // Native module unavailable (Expo Go / web / before prebuild)
    }
  }

  if (Platform.OS === "android") {
    try {
      const { requestWidgetUpdate } = require("react-native-android-widget");
      const { renderWidgetByName } = require("@/widgets/renderWidget");
      for (const name of [
        "PortfolioWidget",
        "FearGreedWidget",
        "LatestPostWidget",
        "LatestExchangeWidget",
        "LatestOGWidget",
        "HeatmapWidget",
      ]) {
        requestWidgetUpdate({
          widgetName: name,
          renderWidget: (props: { width: number; height: number }) =>
            renderWidgetByName(name, props),
        }).catch(() => {});
      }
    } catch {
      // Widget library unavailable (Expo Go / web)
    }
  }
}

export async function updateWidgetPortfolio(
  summary: PortfolioSummary | null
): Promise<void> {
  const snapshot = await readSnapshot();
  snapshot.portfolio = summary
    ? {
        totalValue: summary.totalValue,
        totalProfitLoss: summary.totalProfitLoss,
        totalProfitLossPercent: summary.totalProfitLossPercent,
        assetsCount: summary.assetsCount,
      }
    : null;
  snapshot.updatedAt = Date.now();
  await writeSnapshot(snapshot);
}

export async function updateWidgetProStatus(isPro: boolean): Promise<void> {
  const snapshot = await readSnapshot();
  if (snapshot.isPro === isPro && snapshot.updatedAt !== 0) return;
  snapshot.isPro = isPro;
  snapshot.updatedAt = Date.now();
  await writeSnapshot(snapshot);
}

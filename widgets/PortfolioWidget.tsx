import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { WidgetSnapshot } from "@/utils/widgetBridge";
import { formatMoney, formatPercent, profitColor } from "./format";
import { DEEP_LINKS } from "./types";

export function PortfolioWidget({ snapshot }: { snapshot: WidgetSnapshot }) {
  const portfolio = snapshot.portfolio;

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: DEEP_LINKS.portfolio }}
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: "#171717",
        borderRadius: 16,
        padding: 16,
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <TextWidget
        text="PORTFOLIO"
        style={{
          fontSize: 11,
          color: "#808080",
          letterSpacing: 0.1,
          marginBottom: 6,
        }}
      />
      {portfolio && portfolio.assetsCount > 0 ? (
        <FlexWidget style={{ flexDirection: "column" }}>
          <TextWidget
            text={formatMoney(portfolio.totalValue)}
            style={{
              fontSize: 26,
              fontWeight: "bold",
              color: "#ffffff",
              marginBottom: 4,
            }}
          />
          <TextWidget
            text={`${formatMoney(portfolio.totalProfitLoss)} (${formatPercent(
              portfolio.totalProfitLossPercent
            )})`}
            style={{
              fontSize: 14,
              fontWeight: "bold",
              color: profitColor(portfolio.totalProfitLoss),
              marginBottom: 4,
            }}
          />
          <TextWidget
            text={`${portfolio.assetsCount} asset${
              portfolio.assetsCount === 1 ? "" : "s"
            }`}
            style={{ fontSize: 12, color: "#808080" }}
          />
        </FlexWidget>
      ) : (
        <FlexWidget style={{ flexDirection: "column" }}>
          <TextWidget
            text="No crypto yet"
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: "#ffffff",
              marginBottom: 4,
            }}
          />
          <TextWidget
            text="Tap to add your first coin"
            style={{ fontSize: 12, color: "#808080" }}
          />
        </FlexWidget>
      )}
    </FlexWidget>
  );
}

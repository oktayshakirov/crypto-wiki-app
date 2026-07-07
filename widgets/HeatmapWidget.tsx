import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { HeatmapCoin, HeatmapData, DEEP_LINKS } from "./types";
import { changeColor, formatChange, chunk } from "./heatmap";

function HeroCell({ coin }: { coin: HeatmapCoin }) {
  return (
    <FlexWidget
      style={{
        flex: 45,
        height: "match_parent",
        margin: 2,
        borderRadius: 8,
        backgroundColor: changeColor(coin.change24h),
        justifyContent: "center",
        alignItems: "center",
        padding: 4,
      }}
    >
      <TextWidget
        text={coin.symbol}
        style={{ fontSize: 26, fontWeight: "bold", color: "#ffffff" }}
      />
      <TextWidget
        text={formatChange(coin.change24h)}
        style={{ fontSize: 15, color: "#ffffff" }}
      />
    </FlexWidget>
  );
}

function Cell({ coin }: { coin: HeatmapCoin | null }) {
  if (!coin) {
    return <FlexWidget style={{ flex: 1, height: "match_parent", margin: 2 }} />;
  }
  return (
    <FlexWidget
      style={{
        flex: 1,
        height: "match_parent",
        margin: 2,
        borderRadius: 6,
        backgroundColor: changeColor(coin.change24h),
        justifyContent: "center",
        alignItems: "center",
        padding: 2,
      }}
    >
      <TextWidget
        text={coin.symbol}
        style={{ fontSize: 14, fontWeight: "bold", color: "#ffffff" }}
      />
      <TextWidget
        text={formatChange(coin.change24h)}
        style={{ fontSize: 10, color: "#ffffff" }}
      />
    </FlexWidget>
  );
}

export function HeatmapWidget({
  data,
  restCount = 4,
  columns = 2,
}: {
  data: HeatmapData | null;
  restCount?: number;
  columns?: number;
}) {
  if (!data || data.coins.length === 0) {
    return (
      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri: DEEP_LINKS.tools }}
        style={{
          height: "match_parent",
          width: "match_parent",
          backgroundColor: "#171717",
          borderRadius: 16,
          padding: 16,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <TextWidget
          text="CRYPTO HEATMAP"
          style={{ fontSize: 11, color: "#808080", marginBottom: 6 }}
        />
        <TextWidget
          text="No data, check connection"
          style={{ fontSize: 12, color: "#808080", textAlign: "center" }}
        />
      </FlexWidget>
    );
  }

  const [hero, ...others] = data.coins;
  const rest = others.slice(0, restCount);
  const rows = chunk(rest, columns);

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: DEEP_LINKS.tools }}
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: "#171717",
        borderRadius: 12,
        padding: 4,
        flexDirection: "row",
      }}
    >
      <HeroCell coin={hero} />
      <FlexWidget
        style={{ flex: 55, height: "match_parent", flexDirection: "column" }}
      >
        {rows.map((row, ri) => (
          <FlexWidget
            key={ri}
            style={{ flex: 1, width: "match_parent", flexDirection: "row" }}
          >
            {Array.from({ length: columns }).map((_, ci) => (
              <Cell key={ci} coin={row[ci] ?? null} />
            ))}
          </FlexWidget>
        ))}
      </FlexWidget>
    </FlexWidget>
  );
}

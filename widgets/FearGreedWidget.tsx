import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { FearGreedData } from "./types";
import { fearGreedBand } from "./format";

export function FearGreedWidget({ market }: { market: FearGreedData | null }) {
  if (!market) {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        style={{
          height: "match_parent",
          width: "match_parent",
          backgroundColor: "#171717",
          borderRadius: 16,
          padding: 16,
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <TextWidget
          text="FEAR & GREED"
          style={{ fontSize: 11, color: "#808080", marginBottom: 6 }}
        />
        <TextWidget
          text="No data, check connection"
          style={{ fontSize: 12, color: "#808080", textAlign: "center" }}
        />
      </FlexWidget>
    );
  }

  const value = market.fearGreed.value;
  const band = fearGreedBand(value);

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: "match_parent",
        width: "match_parent",
        borderRadius: 16,
        padding: 12,
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundGradient: {
          from: band.from,
          to: band.to,
          orientation: "LEFT_RIGHT",
        },
      }}
    >
      <TextWidget text={band.smiley} style={{ fontSize: 40, marginBottom: 2 }} />
      <TextWidget
        text={String(value)}
        style={{
          fontSize: 30,
          fontWeight: "bold",
          color: "#000000",
        }}
      />
      <TextWidget
        text={band.label}
        style={{
          fontSize: 13,
          fontWeight: "bold",
          color: "#000000",
          textAlign: "center",
        }}
      />
    </FlexWidget>
  );
}

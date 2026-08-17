import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { HalvingData, formatBlocks, formatHalvingEta } from "./halving";

const GOLD = "#FFD700";
const WIDE_PADDING_DP = 14;
const BACKGROUND = "#171717";
const GRAY = "#808080";

/** Filled width of the progress bar, in dp, never zero so it always reads. */
function filledBarDp(progress: number, widthDp?: number): number {
  const inner = Math.max(0, (widthDp ?? 240) - WIDE_PADDING_DP * 2);
  const ratio = Math.min(Math.max(progress / 100, 0), 1);
  return Math.max(2, Math.round(inner * ratio));
}

/**
 * Bitcoin halving countdown.
 *
 * One widget, two shapes. At 2x2 there is only room for the number that
 * matters - days left - so everything else goes. At 4x2 the extra width carries
 * the block count, the estimated date, the subsidy step and a progress bar.
 * Android resizes a placed widget, so `wide` is decided from the measured
 * width rather than by having two widget entries.
 */
export function HalvingWidget({
  data,
  wide,
  widthDp,
}: {
  data: HalvingData;
  wide: boolean;
  /** Measured widget width, needed because the bar cannot be sized in %. */
  widthDp?: number;
}) {
  const subsidy = `${data.currentSubsidy} → ${data.nextSubsidy} BTC`;

  if (!wide) {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        style={{
          height: "match_parent",
          width: "match_parent",
          backgroundColor: BACKGROUND,
          borderRadius: 16,
          padding: 12,
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <TextWidget
          text="NEXT HALVING"
          style={{ fontSize: 10, color: GRAY, letterSpacing: 1 }}
        />
        <TextWidget
          text={String(data.days)}
          style={{
            fontSize: 44,
            fontWeight: "bold",
            color: GOLD,
            marginTop: 2,
          }}
        />
        <TextWidget
          text={data.days === 1 ? "day to go" : "days to go"}
          style={{ fontSize: 12, color: "#FFFFFF" }}
        />
        <TextWidget
          text={
            data.estimated
              ? "estimated"
              : `${formatBlocks(data.blocksRemaining)} blocks`
          }
          style={{ fontSize: 10, color: GRAY, marginTop: 4 }}
        />
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: BACKGROUND,
        borderRadius: 16,
        padding: 14,
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <TextWidget
          text="NEXT BITCOIN HALVING"
          style={{ fontSize: 10, color: GRAY, letterSpacing: 1 }}
        />
        <TextWidget text={subsidy} style={{ fontSize: 10, color: GRAY }} />
      </FlexWidget>

      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "row",
          alignItems: "flex-end",
        }}
      >
        <TextWidget
          text={String(data.days)}
          style={{ fontSize: 40, fontWeight: "bold", color: GOLD }}
        />
        <TextWidget
          text={data.days === 1 ? " day" : " days"}
          style={{ fontSize: 14, color: "#FFFFFF", marginBottom: 6 }}
        />
        <TextWidget
          text={`  ${data.hours}h`}
          style={{ fontSize: 14, color: GRAY, marginBottom: 6 }}
        />
      </FlexWidget>

      {/* Progress through the current epoch. The widget layer sizes children
          in dp or match_parent only - there is no percentage - so the filled
          part is measured against the width Android reports, minus the
          padding on both sides. */}
      <FlexWidget
        style={{
          width: "match_parent",
          height: 4,
          borderRadius: 2,
          backgroundColor: "#2A2A2A",
          flexDirection: "row",
        }}
      >
        <FlexWidget
          style={{
            width: filledBarDp(data.progress, widthDp),
            height: "match_parent",
            borderRadius: 2,
            backgroundColor: GOLD,
          }}
        />
      </FlexWidget>

      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <TextWidget
          text={`${formatBlocks(data.blocksRemaining)} blocks left`}
          style={{ fontSize: 11, color: GRAY }}
        />
        <TextWidget
          text={
            data.estimated
              ? `~${formatHalvingEta(data.eta)} (est.)`
              : `~${formatHalvingEta(data.eta)}`
          }
          style={{ fontSize: 11, color: GRAY }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

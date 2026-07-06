import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

export function LockedWidget({ widgetLabel }: { widgetLabel: string }) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: "#171717",
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
      }}
    >
      <TextWidget
        text="★"
        style={{ fontSize: 28, color: "#FFD700", marginBottom: 4 }}
      />
      <TextWidget
        text={`${widgetLabel} is a Pro feature`}
        style={{
          fontSize: 14,
          color: "#ffffff",
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: 4,
        }}
      />
      <TextWidget
        text="Upgrade to Pro in the app to unlock this widget"
        style={{ fontSize: 12, color: "#808080", textAlign: "center" }}
      />
    </FlexWidget>
  );
}

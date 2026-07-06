import React from "react";
import {
  FlexWidget,
  ImageWidget,
  TextWidget,
} from "react-native-android-widget";
import { ContentItem, thumbnailUrl } from "./types";

// Small 2x2 card (portfolio-style): widget name, then thumbnail, then title.
export function LatestItemWidget({
  label,
  item,
  deepLink,
}: {
  label: string;
  item: ContentItem | null;
  deepLink: string;
}) {
  const thumb = item?.image ? thumbnailUrl(item.image) : "";

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: deepLink }}
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: "#171717",
        borderRadius: 16,
        padding: 14,
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <TextWidget
        text={label}
        style={{ fontSize: 11, color: "#808080", marginBottom: 6 }}
      />
      {item ? (
        <FlexWidget style={{ flexDirection: "column" }}>
          <TextWidget
            text={item.title}
            maxLines={3}
            style={{ fontSize: 14, fontWeight: "bold", color: "#ffffff" }}
          />
          {thumb ? (
            <ImageWidget
              image={thumb as `https:${string}`}
              imageWidth={56}
              imageHeight={56}
              radius={10}
              style={{ marginTop: 8 }}
            />
          ) : null}
        </FlexWidget>
      ) : (
        <TextWidget
          text="No data, check connection"
          style={{ fontSize: 12, color: "#808080" }}
        />
      )}
    </FlexWidget>
  );
}

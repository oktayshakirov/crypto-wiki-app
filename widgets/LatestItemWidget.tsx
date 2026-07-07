import React from "react";
import {
  FlexWidget,
  ImageWidget,
  TextWidget,
} from "react-native-android-widget";
import { ContentItem, thumbnailUrl } from "./types";

// Small 2x2 card (portfolio-style): widget name, then thumbnail, then title.
const CARD_PADDING = 14;
const MAX_IMG_HEIGHT = 70;

// Fit the image within (available width x max height) preserving its original
// ratio: wide images fill the full width, square/tall images get height-capped.
function imageSize(
  item: ContentItem,
  widthDp?: number
): { width: number; height: number } {
  const availWidth = Math.max((widthDp || 150) - CARD_PADDING * 2, 60);
  const iw = item.imgWidth;
  const ih = item.imgHeight;
  if (!iw || !ih) {
    return { width: availWidth, height: Math.min(availWidth * 0.6, MAX_IMG_HEIGHT) };
  }
  const scale = Math.min(availWidth / iw, MAX_IMG_HEIGHT / ih);
  return { width: Math.round(iw * scale), height: Math.round(ih * scale) };
}

export function LatestItemWidget({
  label,
  item,
  deepLink,
  widthDp,
}: {
  label: string;
  item: ContentItem | null;
  deepLink: string;
  widthDp?: number;
}) {
  const thumb = item?.image ? thumbnailUrl(item.image, 256) : "";
  const imgSize = item ? imageSize(item, widthDp) : null;

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
          {thumb && imgSize ? (
            <ImageWidget
              image={thumb as `https:${string}`}
              imageWidth={imgSize.width}
              imageHeight={imgSize.height}
              radius={8}
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

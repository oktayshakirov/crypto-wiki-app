import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { renderWidgetByName } from "./renderWidget";

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, widgetAction, renderWidget } = props;

  switch (widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED":
      renderWidget(
        await renderWidgetByName(widgetInfo.widgetName, {
          width: widgetInfo.width,
          height: widgetInfo.height,
        })
      );
      break;

    case "WIDGET_CLICK":
      // Clicks are handled via OPEN_APP / OPEN_URI on the widget elements
      break;

    default:
      break;
  }
}

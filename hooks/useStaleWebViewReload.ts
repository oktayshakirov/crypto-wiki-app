import { useEffect, useRef } from "react";
import { AppState } from "react-native";

// Reload only when the app was backgrounded long enough for the content to
// go stale - a quick app switch keeps scroll position and avoids a full
// page load.
const STALE_RELOAD_MS = 10 * 60 * 1000;

export function useStaleWebViewReload(onReload: () => void) {
  const backgroundedAt = useRef<number | null>(null);
  const onReloadRef = useRef(onReload);
  onReloadRef.current = onReload;

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background") {
        backgroundedAt.current = Date.now();
      } else if (nextAppState === "active") {
        const backgroundedSince = backgroundedAt.current;
        backgroundedAt.current = null;
        if (
          backgroundedSince !== null &&
          Date.now() - backgroundedSince > STALE_RELOAD_MS
        ) {
          onReloadRef.current();
        }
      }
    });
    return () => subscription.remove();
  }, []);
}

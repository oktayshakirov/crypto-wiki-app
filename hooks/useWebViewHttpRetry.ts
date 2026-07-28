import { useEffect, useRef } from "react";

// A page opened from a "New Post" push notification can answer 404 for a few
// seconds while the deployment that contains it is still being promoted. The
// site sync now waits for the page to be live before the notification is sent
// (crypto-wiki/pages/api/syncContent.js), so this is only the last line of
// defence against a cold CDN edge - one silent reload, then the site's own 404
// page is left to render exactly as it did before.
const RETRY_DELAY_MS = 3000;
const MAX_RETRIES = 1;

/**
 * True when `url` is the page itself rather than one of its subresources.
 *
 * onHttpError also fires for images, scripts and stylesheets, so without this
 * check a single missing asset would trigger a full page reload.
 */
function isSameDocument(url: string | undefined, current: string): boolean {
  if (!url) {
    return false;
  }
  const strip = (value: string) =>
    value.split(/[?#]/)[0].replace(/\/+$/, "").toLowerCase();
  return strip(url) === strip(current);
}

interface HttpErrorEvent {
  nativeEvent: { url?: string; statusCode?: number };
}

/**
 * Returns an `onHttpError` handler that reloads the WebView once, after a short
 * delay, when the page itself comes back as an HTTP error.
 *
 * The retry budget resets whenever `currentUrl` changes, so each page gets its
 * own single attempt.
 */
export function useWebViewHttpRetry(
  currentUrl: string,
  onReload: () => void
): (event: HttpErrorEvent) => void {
  const retries = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onReloadRef = useRef(onReload);
  onReloadRef.current = onReload;

  useEffect(() => {
    retries.current = 0;
  }, [currentUrl]);

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  return (event: HttpErrorEvent) => {
    const { url, statusCode } = event.nativeEvent;

    if (!isSameDocument(url, currentUrl)) {
      return;
    }
    if (statusCode !== undefined && statusCode < 400) {
      return;
    }
    if (retries.current >= MAX_RETRIES) {
      return;
    }

    retries.current += 1;
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      timer.current = null;
      onReloadRef.current();
    }, RETRY_DELAY_MS);
  };
}

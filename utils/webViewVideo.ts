// Everything the WebView needs so an embedded YouTube player behaves the way it
// does in mobile Safari and Chrome: plays inline, goes fullscreen, and comes
// back - without the app treating the player as an outbound link.
//
// The site embeds videos as a facade: the poster is ours, and only once the
// visitor taps does it insert an iframe pointing at youtube-nocookie.com. That
// iframe load is a request to a host that is not ours, which is exactly what a
// naive "is this our domain?" check in onShouldStartLoadWithRequest rejects.
// Pushed out to the system browser, an /embed/ URL is not a watchable page on
// its own and YouTube answers "Video unavailable" (error 153).
import { Platform } from "react-native";

/**
 * The embed document and everything the player fetches underneath it.
 *
 * Deliberately not "any youtube.com URL": when the viewer taps *Watch on
 * YouTube* the player navigates the top frame to /watch, and that one should
 * still leave the app for the YouTube app or the browser. Only the player's own
 * traffic is matched here.
 */
export function isVideoPlayerRequest(url: string): boolean {
  return (
    /^https?:\/\/(www\.)?youtube(-nocookie)?\.com\/(embed|youtubei|iframe_api|s\/player|api\/stats|generate_204|error_204|ptracking)/.test(
      url
    ) || /^https?:\/\/[^/]*\.(ytimg|googlevideo|gstatic)\.com\//.test(url)
  );
}

type LoadRequest = {
  url: string;
  /** iOS only - Android never sends it, hence the explicit `=== false`. */
  isTopFrame?: boolean;
};

/**
 * Builds the onShouldStartLoadWithRequest handler.
 *
 * `ownDomain` stays in the WebView, real outbound links go to `openExternal`,
 * and the player is allowed through in between.
 */
export function createShouldStartLoadWithRequest(
  ownDomain: string,
  openExternal: (url: string) => void
) {
  return (request: LoadRequest): boolean => {
    const { url, isTopFrame } = request;

    // iOS reports subframes, and an iframe is never a page the user is trying
    // to navigate to. Android does not report it, which is what the player
    // check below covers.
    if (isTopFrame === false) {
      return true;
    }

    if (url.includes(ownDomain) || url.startsWith("about:")) {
      return true;
    }

    if (isVideoPlayerRequest(url)) {
      return true;
    }

    openExternal(url);
    return false;
  };
}

/**
 * WebView props required for video playback.
 *
 * `allowsInlineMediaPlayback` is the one that matters most on iOS: without it
 * WKWebView refuses to play in place and hands the video to the native
 * fullscreen player, which drops the viewer out of the page. `allowsFullscreenVideo`
 * is the Android half - the player's fullscreen button does nothing without it.
 *
 * `mediaPlaybackRequiresUserAction: false` is safe here because nothing on the
 * site autoplays on load. Only the facade sets `autoplay=1`, and it only does
 * so in response to a tap; without this the viewer would have to press play a
 * second time inside the player.
 */
export const VIDEO_WEBVIEW_PROPS = {
  allowsInlineMediaPlayback: true,
  mediaPlaybackRequiresUserAction: false,
  allowsFullscreenVideo: true,
  allowsAirPlayForMediaPlayback: true,
  // Android opens target="_blank" in a second window that nothing here renders,
  // so "Watch on YouTube" would silently do nothing. Forcing it into the same
  // frame sends it through onShouldStartLoadWithRequest, which opens it
  // properly.
  ...(Platform.OS === "android" ? { setSupportMultipleWindows: false } : {}),
} as const;

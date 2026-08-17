// Messages the site posts to the app, for the things a web page cannot do
// itself.
//
// The one case today is the "Portfolio Tracker" tile that pages/tools/index.js
// renders only when `isApp`: there is no web portfolio, so instead of a link it
// posts NAVIGATE and the app pushes its native screen.
//
// This used to live in the tools tab alone, which was fine while /tools was a
// tab. It is not a tab any more - it is reached from the tools tiles on the
// home page - so the message now arrives in whichever WebView the visitor
// happens to be in, and every one of them has to understand it or the tile
// silently does nothing.

type NativeMessage = { type?: string; path?: string };

/**
 * Handles a message from the site. Returns true when it was one of ours, so
 * the caller can stop looking at it.
 *
 * Takes the router rather than a bare `router.push`: called as a method it
 * keeps whatever `this` expo-router expects, which a detached reference would
 * not.
 */
export function handleNativeNavigation(
  data: NativeMessage,
  router: { push: (path: string) => void }
): boolean {
  if (data?.type === "NAVIGATE" && data.path === "/portfolio") {
    router.push("/portfolio");
    return true;
  }
  return false;
}

// Maps a push notification payload onto an in-app destination.
//
// The Cloud Functions (functions/src/index.ts) send `{ type, slug, url }`, where
// `url` is the canonical site URL for the new content:
//   type "post"     -> https://www.thecrypto.wiki/posts/<slug>      -> Posts tab
//   type "exchange" -> https://www.thecrypto.wiki/exchanges/<slug>  -> Exchanges tab
//   type "og"       -> https://www.thecrypto.wiki/crypto-ogs/<slug> -> OGs tab
//
// Anyone who learns an Expo push token can send to it, so the payload is
// untrusted input: the URL is host-checked against our own site before it is
// handed to a WebView, and the destination tab is derived from our own mapping
// rather than from anything the payload chooses.

/** Hosts we are willing to load in the in-app WebView from a notification. */
const ALLOWED_HOSTS = ["www.thecrypto.wiki", "thecrypto.wiki"];

/** Tab route, paired with the `targetTab` key its screen matches on. */
export interface NotificationTarget {
  pathname: "/(tabs)/posts" | "/(tabs)/exchanges" | "/(tabs)/ogs";
  targetTab: "posts" | "exchanges" | "ogs";
  url: string;
}

type Destination = Omit<NotificationTarget, "url">;

const POSTS: Destination = { pathname: "/(tabs)/posts", targetTab: "posts" };
const EXCHANGES: Destination = {
  pathname: "/(tabs)/exchanges",
  targetTab: "exchanges",
};
const OGS: Destination = { pathname: "/(tabs)/ogs", targetTab: "ogs" };

const TYPE_TO_TAB: Record<string, Destination> = {
  post: POSTS,
  exchange: EXCHANGES,
  og: OGS,
};

/** Fallback when `type` is missing or unrecognised: infer the tab from the path. */
const PATH_TO_TAB: { prefix: string; destination: Destination }[] = [
  { prefix: "/posts", destination: POSTS },
  { prefix: "/exchanges", destination: EXCHANGES },
  { prefix: "/crypto-ogs", destination: OGS },
];

/**
 * Extracts the `https://host` authority of a URL, lowercased.
 *
 * Deliberately hand-rolled rather than using `URL`: it must reject anything
 * that is not plain https, and stopping at the first `/`, `?` or `#` keeps
 * lookalikes such as `https://thecrypto.wiki.example.com` or
 * `https://example.com/@www.thecrypto.wiki` from matching the allowlist.
 */
function getHost(url: string): string | null {
  const match = /^https:\/\/([^/?#]+)/i.exec(url);
  return match ? match[1].toLowerCase() : null;
}

function isTrustedUrl(url: string): boolean {
  const host = getHost(url);
  return host !== null && ALLOWED_HOSTS.includes(host);
}

/** Adds the `isApp` flag the site uses to hide its own chrome inside the app. */
function withAppFlag(url: string): string {
  if (/[?&]isApp=/.test(url)) {
    return url;
  }
  return `${url}${url.includes("?") ? "&" : "?"}isApp=true`;
}

/**
 * Resolves the tab and URL a notification tap should open, or `null` when the
 * payload carries no usable (or no trustworthy) destination.
 */
export function resolveNotificationTarget(
  data: unknown
): NotificationTarget | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }

  const { type, url } = data as { type?: unknown; url?: unknown };

  if (typeof url !== "string" || !isTrustedUrl(url)) {
    return null;
  }

  const fromType = typeof type === "string" ? TYPE_TO_TAB[type] : undefined;
  const path = url.slice(`https://${getHost(url)}`.length);
  const fromPath = PATH_TO_TAB.find(
    (entry) => path === entry.prefix || path.startsWith(`${entry.prefix}/`)
  )?.destination;

  const destination = fromType ?? fromPath;
  if (!destination) {
    return null;
  }

  return { ...destination, url: withAppFlag(url) };
}

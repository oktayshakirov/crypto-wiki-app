/* eslint-disable */
import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

const FEARGREED_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour (Fear & Greed updates daily)
const CONTENT_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const HEATMAP_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface FearGreedData {
  fearGreed: { value: number; label: string };
  updatedAt: number;
}

interface HeatmapCoin {
  symbol: string;
  marketCap: number;
  change24h: number;
}

interface HeatmapData {
  coins: HeatmapCoin[];
  updatedAt: number;
}

interface ContentItem {
  title: string;
  image: string;
  url: string;
  imgWidth?: number;
  imgHeight?: number;
}

interface ContentData {
  latestPost: ContentItem | null;
  latestExchange: ContentItem | null;
  latestOG: ContentItem | null;
  updatedAt: number;
}

async function fetchJson(url: string): Promise<any> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }
  return response.json();
}

async function fetchFearGreed(): Promise<FearGreedData> {
  const res = await fetchJson("https://api.alternative.me/fng/?limit=1");
  const fng = res?.data?.[0];

  if (!fng) {
    throw new Error("Fear & Greed source failed");
  }

  return {
    fearGreed: {
      value: parseInt(fng.value ?? "50", 10),
      label: fng.value_classification ?? "Neutral",
    },
    updatedAt: Date.now(),
  };
}

async function fetchHeatmap(): Promise<HeatmapData> {
  const data = await fetchJson(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd" +
      "&order=market_cap_desc&per_page=20&page=1&price_change_percentage=24h"
  );

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Heatmap source failed");
  }

  const coins: HeatmapCoin[] = data
    .map((c: any) => ({
      symbol: String(c.symbol ?? "").toUpperCase(),
      marketCap: Number(c.market_cap) || 0,
      change24h: Number(c.price_change_percentage_24h) || 0,
    }))
    .filter((c) => c.symbol && c.marketCap > 0)
    .sort((a, b) => b.marketCap - a.marketCap);

  return { coins, updatedAt: Date.now() };
}

function cleanTitle(raw: string): string {
  return raw
    .split("|")[0]
    .replace(/\s*-\s*(The)?\s*Crypto[\s.]?Wiki.*$/i, "")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

// Fetches the newest item from a listing page, then reads its Open Graph tags.
// `listingPath` is the section index, `itemPrefix` is an individual item's URL
// prefix. Posts list newest-first (takeLast = false); exchanges and crypto-ogs
// list newest-last (takeLast = true), so we pick the last card link there.
/**
 * Last path segments that belong to a listing rather than to an item.
 *
 * The latest item is scraped out of the listing page's own links, and a tab
 * sitting above the grid matches that pattern just as well as an article does.
 * When /posts gained its "Most popular" tab, `href="/posts/popular"` became the
 * first match on the page, so the Latest Post widget started showing "Most
 * Popular Crypto Posts" over the site's meta image - that page's own og: tags.
 *
 * Pagination never had the problem: `/posts/page/2` carries a second slash and
 * the pattern stops at the first one. It is listed anyway, because the next tab
 * someone adds will not necessarily be so lucky.
 */
const LISTING_SUBROUTES = new Set(["popular", "page", "latest", "featured"]);

async function fetchLatestItem(
  listingPath: string,
  itemPrefix: string,
  takeLast: boolean = false
): Promise<ContentItem | null> {
  const listResponse = await fetch(
    `https://www.thecrypto.wiki${listingPath}`
  );
  if (!listResponse.ok) {
    throw new Error(`${listingPath} HTTP ${listResponse.status}`);
  }
  const listHtml = await listResponse.text();

  const matches = [
    ...listHtml.matchAll(new RegExp(`href="(${itemPrefix}/[^"/]+)"`, "g")),
  ];
  const slugs = [...new Set(matches.map((m) => m[1]))].filter(
    (slug) => !LISTING_SUBROUTES.has(slug.split("/").pop() ?? "")
  );
  const slug = takeLast ? slugs[slugs.length - 1] : slugs[0];

  if (!slug) return null;
  const url = `https://www.thecrypto.wiki${slug}`;

  const pageResponse = await fetch(url);
  const html = pageResponse.ok ? await pageResponse.text() : "";

  const ogTitle =
    html.match(
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
    )?.[1] ??
    html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i
    )?.[1] ??
    html.match(/<title>([^<]+)<\/title>/i)?.[1] ??
    "";

  const ogImage =
    html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
    )?.[1] ??
    html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i
    )?.[1] ??
    "";

  const dims = ogImage ? await pngSize(ogImage) : null;

  return {
    title: cleanTitle(ogTitle),
    image: ogImage,
    url,
    imgWidth: dims?.w,
    imgHeight: dims?.h,
  };
}

// Reads a PNG's intrinsic dimensions from its IHDR header (first ~24 bytes) via a
// Range request, so widgets can preserve the original aspect ratio. Site images
// are PNG; returns null for anything else or on failure.
async function pngSize(
  url: string
): Promise<{ w: number; h: number } | null> {
  try {
    const res = await fetch(url, { headers: { Range: "bytes=0-33" } });
    if (!res.ok && res.status !== 206) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (
      buf.length >= 24 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47
    ) {
      return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchContent(): Promise<ContentData> {
  const [post, exchange, og] = await Promise.allSettled([
    fetchLatestItem("/posts", "/posts"),
    fetchLatestItem("/exchanges", "/exchanges", true),
    fetchLatestItem("/crypto-ogs", "/crypto-ogs", true),
  ]);

  const value = (r: PromiseSettledResult<ContentItem | null>) =>
    r.status === "fulfilled" ? r.value : null;

  const data: ContentData = {
    latestPost: value(post),
    latestExchange: value(exchange),
    latestOG: value(og),
    updatedAt: Date.now(),
  };

  if (!data.latestPost && !data.latestExchange && !data.latestOG) {
    throw new Error("All content sources failed");
  }
  return data;
}

// In-process cache in front of the Firestore one. Cloud Run keeps an instance
// warm between requests, so most requests can be answered without touching
// Firestore at all.
//
// This matters because widget traffic scales with installs, not with anything
// we control: every device polling on its own timer used to cost one document
// read each. With maxInstances capped at 10, Firestore now sees at most one read
// per instance per TTL regardless of how many devices are calling.
//
// Firestore stays the shared tier underneath: it survives cold starts and is
// what keeps a new instance from re-fetching from the upstream API.
const memoryCache = new Map<string, { value: unknown; expiresAt: number }>();

async function serveCached<T extends { updatedAt: number }>(
  cacheDocId: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();

  const local = memoryCache.get(cacheDocId);
  if (local && now < local.expiresAt) {
    return local.value as T;
  }

  const cacheRef = db.collection("widgetCache").doc(cacheDocId);
  const cacheDoc = await cacheRef.get();
  const cached = cacheDoc.exists ? (cacheDoc.data() as T) : null;

  if (cached && now - cached.updatedAt < ttlMs) {
    // Only hold it in memory for the part of the TTL it has left, so an entry
    // written by another instance still expires on schedule here.
    memoryCache.set(cacheDocId, {
      value: cached,
      expiresAt: cached.updatedAt + ttlMs,
    });
    return cached;
  }

  try {
    const fresh = await fetcher();
    await cacheRef.set(fresh);
    memoryCache.set(cacheDocId, { value: fresh, expiresAt: now + ttlMs });
    return fresh;
  } catch (error) {
    // Serve stale data over failing entirely. Do not cache the stale value in
    // memory: the next request should retry the fetcher rather than sit on a
    // failure for a full TTL.
    if (cached) return cached;
    throw error;
  }
}

// maxInstances caps concurrent containers so a bug/abuse spike can't run up an
// unbounded bill. Each instance handles up to 80 concurrent requests, so 10 is
// ample for widget traffic while keeping the worst case firmly bounded.
export const getWidgetData = onRequest({ maxInstances: 10 }, async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).send("Method Not Allowed");
    return;
  }
  try {
    const data = await serveCached(
      "feargreed",
      FEARGREED_CACHE_TTL_MS,
      fetchFearGreed
    );
    res.set("Cache-Control", "public, max-age=3600");
    res.status(200).json(data);
  } catch (error) {
    console.error("getWidgetData error:", error);
    res.status(500).json({ error: "Failed to fetch Fear & Greed data" });
  }
});

export const getWidgetHeatmap = onRequest(
  { maxInstances: 10 },
  async (req, res) => {
    if (req.method !== "GET") {
      res.status(405).send("Method Not Allowed");
      return;
    }
    try {
      const data = await serveCached(
        "heatmap",
        HEATMAP_CACHE_TTL_MS,
        fetchHeatmap
      );
      res.set("Cache-Control", "public, max-age=1800");
      res.status(200).json(data);
    } catch (error) {
      console.error("getWidgetHeatmap error:", error);
      res.status(500).json({ error: "Failed to fetch heatmap data" });
    }
  }
);

export const getWidgetContent = onRequest(
  { maxInstances: 10 },
  async (req, res) => {
    if (req.method !== "GET") {
      res.status(405).send("Method Not Allowed");
      return;
    }
    try {
      const data = await serveCached(
        "content",
        CONTENT_CACHE_TTL_MS,
        fetchContent
      );
      res.set("Cache-Control", "public, max-age=21600");
      res.status(200).json(data);
    } catch (error) {
      console.error("getWidgetContent error:", error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  }
);

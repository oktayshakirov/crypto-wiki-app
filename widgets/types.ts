export interface FearGreedData {
  fearGreed: { value: number; label: string };
  updatedAt: number;
}

export interface ContentItem {
  title: string;
  image: string;
  url: string;
  imgWidth?: number;
  imgHeight?: number;
}

export interface ContentData {
  latestPost: ContentItem | null;
  latestExchange: ContentItem | null;
  latestOG: ContentItem | null;
  updatedAt: number;
}

export interface HeatmapCoin {
  symbol: string;
  marketCap: number;
  change24h: number;
}

export interface HeatmapData {
  coins: HeatmapCoin[];
  updatedAt: number;
}

// Route an image URL through the site's Next.js image optimizer to get a tiny
// thumbnail (~1-5 KB) instead of the full-size asset, cheap and safe for widgets.
export function thumbnailUrl(imageUrl: string, w: number = 128): string {
  if (!imageUrl) return "";
  const m = imageUrl.match(/^(https?:\/\/[^/]+)(\/.*)$/);
  if (!m) return imageUrl;
  return `${m[1]}/_next/image?url=${encodeURIComponent(m[2])}&w=${w}&q=75`;
}

export const DEEP_LINKS = {
  portfolio: "TheCrypto.wiki://portfolio",
  posts: "TheCrypto.wiki://posts",
  exchanges: "TheCrypto.wiki://exchanges",
  ogs: "TheCrypto.wiki://ogs",
  tools: "TheCrypto.wiki://tools",
};

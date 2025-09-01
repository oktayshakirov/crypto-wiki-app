import AsyncStorage from "@react-native-async-storage/async-storage";
import { ImageCache } from "./imageCache";

export interface SavedContent {
  id: string;
  type: "posts" | "exchanges" | "crypto-ogs";
  title: string;
  description: string;
  image: string;
  url: string;
  slug: string;
  content: string;
  savedAt: string;
  publishedDate?: string;
  author?: string;
  categories?: string[];
  tags?: string[];
  uniqueId?: string;
}

export class SavedContentStorage {
  private static readonly STORAGE_KEYS = {
    POSTS: "@saved_content_posts",
    EXCHANGES: "@saved_content_exchanges",
    CRYPTO_OGS: "@saved_content_crypto_ogs",
  };

  private static getStorageKey(type: SavedContent["type"]): string {
    switch (type) {
      case "posts":
        return this.STORAGE_KEYS.POSTS;
      case "exchanges":
        return this.STORAGE_KEYS.EXCHANGES;
      case "crypto-ogs":
        return this.STORAGE_KEYS.CRYPTO_OGS;
      default:
        throw new Error(`Unknown content type: ${type}`);
    }
  }

  private static generateUniqueId(url: string, slug: string): string {
    return `${slug}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static async saveContent(content: SavedContent): Promise<void> {
    try {
      const key = this.getStorageKey(content.type);
      const existingData = await this.getSavedContent(content.type);

      const urlDuplicateIndex = existingData.findIndex(
        (item) => item.url === content.url
      );

      if (urlDuplicateIndex >= 0) {
        existingData[urlDuplicateIndex] = {
          ...content,
          uniqueId:
            existingData[urlDuplicateIndex].uniqueId ||
            this.generateUniqueId(content.url, content.slug),
          savedAt: new Date().toISOString(),
        };
      } else {
        const slugDuplicateIndex = existingData.findIndex(
          (item) => item.slug === content.slug && item.type === content.type
        );

        if (slugDuplicateIndex >= 0) {
          existingData.splice(slugDuplicateIndex, 1);
        }

        const newContent = {
          ...content,
          uniqueId: this.generateUniqueId(content.url, content.slug),
        };
        existingData.push(newContent);
      }

      existingData.sort(
        (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      );

      await AsyncStorage.setItem(key, JSON.stringify(existingData));
    } catch (error) {
      throw error;
    }
  }

  static async getSavedContent(
    type: SavedContent["type"]
  ): Promise<SavedContent[]> {
    try {
      const key = this.getStorageKey(type);
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  static async getSavedContentById(
    type: SavedContent["type"],
    id: string
  ): Promise<SavedContent | null> {
    try {
      const savedContent = await this.getSavedContent(type);
      return savedContent.find((item) => item.id === id) || null;
    } catch (error) {
      return null;
    }
  }

  static async getSavedContentByUrl(url: string): Promise<SavedContent | null> {
    try {
      const contentType = getContentTypeFromUrl(url);
      if (!contentType) return null;

      const savedContent = await this.getSavedContent(contentType);
      return savedContent.find((item) => item.url === url) || null;
    } catch (error) {
      return null;
    }
  }

  static async removeSavedContent(
    type: SavedContent["type"],
    id: string
  ): Promise<void> {
    try {
      const key = this.getStorageKey(type);
      const existingData = await this.getSavedContent(type);
      const filteredData = existingData.filter((item) => item.id !== id);
      await AsyncStorage.setItem(key, JSON.stringify(filteredData));

      await ImageCache.clearCacheForContent(id);
    } catch (error) {
      throw error;
    }
  }

  static async isContentSaved(
    type: SavedContent["type"],
    id: string
  ): Promise<boolean> {
    try {
      const savedContent = await this.getSavedContentById(type, id);
      return savedContent !== null;
    } catch (error) {
      return false;
    }
  }

  static async isContentSavedByUrl(url: string): Promise<boolean> {
    try {
      const savedContent = await this.getSavedContentByUrl(url);
      return savedContent !== null;
    } catch (error) {
      return false;
    }
  }

  static async getSavedContentCount(
    type: SavedContent["type"]
  ): Promise<number> {
    try {
      const savedContent = await this.getSavedContent(type);
      return savedContent.length;
    } catch (error) {
      return 0;
    }
  }

  static async clearSavedContent(type: SavedContent["type"]): Promise<void> {
    try {
      const key = this.getStorageKey(type);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      throw error;
    }
  }

  static async getAllSavedContentCounts(): Promise<{
    posts: number;
    exchanges: number;
    "crypto-ogs": number;
  }> {
    try {
      const [postsCount, exchangesCount, cryptoOgsCount] = await Promise.all([
        this.getSavedContentCount("posts"),
        this.getSavedContentCount("exchanges"),
        this.getSavedContentCount("crypto-ogs"),
      ]);

      return {
        posts: postsCount,
        exchanges: exchangesCount,
        "crypto-ogs": cryptoOgsCount,
      };
    } catch (error) {
      return {
        posts: 0,
        exchanges: 0,
        "crypto-ogs": 0,
      };
    }
  }
}

export function extractSlugFromUrl(url: string): string | null {
  try {
    if (!url || typeof url !== "string" || url.trim() === "") {
      return null;
    }

    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname
      .split("/")
      .filter((segment) => segment.length > 0);

    if (pathSegments.length >= 2) {
      const contentType = pathSegments[0];
      const slug = pathSegments[1];

      if (["posts", "exchanges", "crypto-ogs"].includes(contentType)) {
        return slug;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

export function getContentTypeFromUrl(
  url: string
): SavedContent["type"] | null {
  try {
    if (!url || typeof url !== "string" || url.trim() === "") {
      return null;
    }

    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname
      .split("/")
      .filter((segment) => segment.length > 0);

    if (pathSegments.length >= 2) {
      const contentType = pathSegments[0];

      switch (contentType) {
        case "posts":
          return "posts";
        case "exchanges":
          return "exchanges";
        case "crypto-ogs":
          return "crypto-ogs";
        default:
          return null;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

export function isDetailPageUrl(url: string): boolean {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return false;
  }

  const contentType = getContentTypeFromUrl(url);
  const slug = extractSlugFromUrl(url);
  return contentType !== null && slug !== null;
}

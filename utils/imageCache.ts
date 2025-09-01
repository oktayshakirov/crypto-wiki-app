import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

const IMAGE_CACHE_KEY = "@image_cache_mapping";
const CACHE_DIR = FileSystem.cacheDirectory + "saved_images/";

export class ImageCache {
  static async ensureCacheDirExists(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }
    } catch {}
  }

  static generateFileName(url: string): string {
    const urlHash = url.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 100);
    const extension = url.split(".").pop()?.toLowerCase() || "jpg";
    const validExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
    const finalExtension = validExtensions.includes(extension)
      ? extension
      : "jpg";
    return `${urlHash}.${finalExtension}`;
  }

  static async downloadAndCacheImage(
    url: string,
    contentId: string
  ): Promise<string | null> {
    try {
      if (!url || url.trim() === "") {
        return null;
      }

      await this.ensureCacheDirExists();

      const fileName = this.generateFileName(url);
      const localPath = CACHE_DIR + fileName;

      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        await this.updateCacheMapping(url, localPath, contentId);
        return localPath;
      }

      const downloadResult = await FileSystem.downloadAsync(url, localPath);

      if (downloadResult.status === 200) {
        await this.updateCacheMapping(url, localPath, contentId);
        return localPath;
      }

      return null;
    } catch {
      return null;
    }
  }

  static async updateCacheMapping(
    originalUrl: string,
    localPath: string,
    contentId: string
  ): Promise<void> {
    try {
      const existingMapping = await AsyncStorage.getItem(IMAGE_CACHE_KEY);
      const mapping = existingMapping ? JSON.parse(existingMapping) : {};

      mapping[originalUrl] = {
        localPath,
        contentId,
        cachedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(mapping));
    } catch {}
  }

  static async getCachedImagePath(url: string): Promise<string | null> {
    try {
      if (!url || url.trim() === "") {
        return null;
      }

      const existingMapping = await AsyncStorage.getItem(IMAGE_CACHE_KEY);
      if (!existingMapping) {
        return null;
      }

      const mapping = JSON.parse(existingMapping);
      const cacheEntry = mapping[url];

      if (cacheEntry?.localPath) {
        const fileInfo = await FileSystem.getInfoAsync(cacheEntry.localPath);
        if (fileInfo.exists) {
          return cacheEntry.localPath;
        } else {
          delete mapping[url];
          await AsyncStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(mapping));
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  static async clearCacheForContent(contentId: string): Promise<void> {
    try {
      const existingMapping = await AsyncStorage.getItem(IMAGE_CACHE_KEY);
      if (!existingMapping) {
        return;
      }

      const mapping = JSON.parse(existingMapping);
      const urlsToRemove: string[] = [];

      for (const [url, entry] of Object.entries(mapping)) {
        if ((entry as any).contentId === contentId) {
          urlsToRemove.push(url);

          try {
            const localPath = (entry as any).localPath;
            const fileInfo = await FileSystem.getInfoAsync(localPath);
            if (fileInfo.exists) {
              await FileSystem.deleteAsync(localPath);
            }
          } catch {}
        }
      }

      for (const url of urlsToRemove) {
        delete mapping[url];
      }

      await AsyncStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(mapping));
    } catch {}
  }

  static async clearAllCache(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(CACHE_DIR);
      }

      await AsyncStorage.removeItem(IMAGE_CACHE_KEY);
    } catch {}
  }
  static async getImageSource(
    url: string
  ): Promise<{ uri: string } | number | null> {
    try {
      if (!url || url.trim() === "") {
        return null;
      }

      const cachedPath = await this.getCachedImagePath(url);
      if (cachedPath) {
        return { uri: cachedPath };
      }

      return { uri: url };
    } catch {
      return null;
    }
  }
}

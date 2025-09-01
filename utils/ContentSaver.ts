import { Alert } from "react-native";
import { ImageCache } from "@/utils/imageCache";
import * as FileSystem from "expo-file-system";
import { SavedContentStorage } from "@/utils/savedContentStorage";

export class ContentSaver {
  static async saveContent(
    currentUrl: string,
    currentPageType: string | null,
    currentPageSlug: string | null,
    getWebViewRef: (id: string) => any,
    saveCurrentPage: (data: any) => Promise<boolean>
  ): Promise<void> {
    try {
      const alreadySaved = await SavedContentStorage.isContentSavedByUrl(
        currentUrl
      );
      if (alreadySaved) {
        Alert.alert("Info", "This content is already saved");
        return;
      }

      let webViewId = "home";
      let webViewRef = null;

      if (currentPageType === "posts") {
        webViewId = "posts";
        webViewRef = getWebViewRef("posts");
      } else if (currentPageType === "exchanges") {
        webViewId = "exchanges";
        webViewRef = getWebViewRef("exchanges");
      } else if (currentPageType === "crypto-ogs") {
        webViewId = "crypto-ogs";
        webViewRef = getWebViewRef("crypto-ogs");
      }

      if (!webViewRef?.current && currentPageType) {
        const webviewOptions = [
          { id: "posts", name: "posts" },
          { id: "exchanges", name: "exchanges" },
          { id: "crypto-ogs", name: "crypto-ogs" },
          { id: "home", name: "home" },
        ];

        for (const option of webviewOptions) {
          const testWebView = getWebViewRef(option.id);
          if (testWebView?.current) {
            webViewId = option.id;
            webViewRef = testWebView;
            break;
          }
        }
      }

      if (!webViewRef?.current) {
        webViewId = "home";
        webViewRef = getWebViewRef("home");
      }

      if (!webViewRef?.current) {
        Alert.alert("Error", "Cannot access webview content");
        return;
      }

      await this.navigateToCorrectPage(
        webViewRef,
        currentUrl,
        currentPageSlug,
        currentPageType
      );
      const extractedMetadata = await this.extractPageMetadata(
        webViewRef,
        currentUrl
      );

      if (!extractedMetadata) {
        Alert.alert("Error", "Failed to extract page content");
        return;
      }

      if (extractedMetadata.url && extractedMetadata.url !== currentUrl) {
        Alert.alert("Error", "Content mismatch - wrong page extracted");
        return;
      }

      const pageData = await this.processPageData(
        extractedMetadata,
        currentPageSlug,
        currentUrl
      );
      const success = await saveCurrentPage(pageData);

      if (success) {
        Alert.alert("Success", "Content saved for offline viewing");
      } else {
        Alert.alert("Error", "Failed to save content");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    }
  }

  private static async navigateToCorrectPage(
    webViewRef: any,
    currentUrl: string,
    currentPageSlug: string | null,
    currentPageType: string | null
  ): Promise<void> {
    (global as any).extractedMetadata = null;
    (global as any).webviewCurrentUrl = null;
    (global as any).webviewCurrentPath = null;

    webViewRef.current.injectJavaScript(`
      (function() {
        const currentUrl = window.location.href;
        const currentPath = window.location.pathname;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'URL_VERIFICATION',
          currentUrl: currentUrl,
          currentPath: currentPath,
          expectedUrl: '${currentUrl}',
          timestamp: Date.now()
        }));
      })();
      true;
    `);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const webviewUrl = (global as any).webviewCurrentUrl;
    const webviewPath = (global as any).webviewCurrentPath;
    const expectedPath = new URL(currentUrl).pathname;

    const isUrlMatch = webviewUrl === currentUrl;
    const isPathMatch = webviewPath === expectedPath;
    const isContentMatch =
      webviewPath && webviewPath.includes(currentPageSlug || "");
    const isCorrectContentType =
      webviewPath && webviewPath.includes(`/${currentPageType}/`);

    if (
      !isUrlMatch &&
      !isPathMatch &&
      !isContentMatch &&
      !isCorrectContentType
    ) {
      webViewRef.current.injectJavaScript(`
        if (window.location.href !== "${currentUrl}") {
          window.location.href = "${currentUrl}";
        }
        true;
      `);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      webViewRef.current.injectJavaScript(`
        (function() {
          const currentUrl = window.location.href;
          const currentPath = window.location.pathname;
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'URL_VERIFICATION',
            currentUrl: currentUrl,
            currentPath: currentPath,
            expectedUrl: '${currentUrl}',
            timestamp: Date.now()
          }));
        })();
        true;
      `);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const newWebviewUrl = (global as any).webviewCurrentUrl;
      if (newWebviewUrl !== currentUrl) {
        Alert.alert("Error", "Failed to navigate to correct page");
        return;
      }
    }
  }

  private static async extractPageMetadata(
    webViewRef: any,
    currentUrl: string
  ): Promise<any> {
    webViewRef.current.injectJavaScript(this.getExtractionScript(currentUrl));

    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      attempts++;

      if ((global as any).extractedMetadata) {
        break;
      }
    }

    return (global as any).extractedMetadata;
  }

  private static getExtractionScript(currentUrl: string): string {
    return `
      (function() {
        try {
          const currentUrl = window.location.href;
          const expectedUrl = '${currentUrl}';
          
          if (currentUrl !== expectedUrl) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'URL_MISMATCH',
              currentUrl: currentUrl,
              expectedUrl: expectedUrl,
              timestamp: Date.now()
            }));
            return;
          }

          function extractPageContent() {
            const contentDiv = document.querySelector('.content');
            if (contentDiv) {
              const styleSheets = Array.from(document.styleSheets);
              let cssText = '';
              
              styleSheets.forEach(sheet => {
                try {
                  const rules = Array.from(sheet.cssRules || sheet.rules || []);
                  rules.forEach(rule => {
                    if (rule.selectorText) {
                      if (rule.selectorText.includes('.content') || 
                          rule.selectorText.includes('h1') || 
                          rule.selectorText.includes('h2') || 
                          rule.selectorText.includes('h3') || 
                          rule.selectorText.includes('p') || 
                          rule.selectorText.includes('a') || 
                          rule.selectorText.includes('ul') || 
                          rule.selectorText.includes('ol') || 
                          rule.selectorText.includes('li') || 
                          rule.selectorText.includes('img') ||
                          rule.selectorText.includes('blockquote') ||
                          rule.selectorText.includes('code') ||
                          rule.selectorText.includes('pre') ||
                          rule.selectorText.includes('table') ||
                          rule.selectorText.includes('th') ||
                          rule.selectorText.includes('td')) {
                        cssText += rule.cssText + '\\n';
                      }
                    }
                  });
                } catch (e) {
                }
              });
              
              return \`<style>\${cssText}</style>\${contentDiv.innerHTML}\`;
            }
            
            const contentSelectors = [
              '.post-content',
              '.article-content',
              '.entry-content',
              'main',
              '[role="main"]',
              'article'
            ];
            
            for (const selector of contentSelectors) {
              const element = document.querySelector(selector);
              if (element && element.innerHTML.trim().length > 200) {
                return element.innerHTML;
              }
            }
            
            try {
              const nextData = window.__NEXT_DATA__;
              if (nextData && nextData.props && nextData.props.pageProps) {
                const pageProps = nextData.props.pageProps;
                
                if (pageProps.post && pageProps.post.content) {
                  return pageProps.post.content;
                }
                
                if (pageProps.exchange && pageProps.exchange.content) {
                  return pageProps.exchange.content;
                }
                
                if (pageProps.og && pageProps.og.content) {
                  return pageProps.og.content;
                }
              }
            } catch (error) {
            }
            
            return '';
          }

          const nextDataElement = document.getElementById('__NEXT_DATA__');
          if (nextDataElement) {
            const data = JSON.parse(nextDataElement.textContent);
            const pageProps = data?.props?.pageProps;
            
            let currentItem = null;
            let contentType = null;
            const currentPath = window.location.pathname;
            
            if (pageProps?.posts && Array.isArray(pageProps.posts)) {
              currentItem = pageProps.posts.find(post => 
                post.slug && (currentPath.includes(post.slug) || currentPath.endsWith(post.slug))
              );
              if (currentItem) {
                contentType = "posts";
              }
            }
            
            if (!currentItem && pageProps?.exchanges && Array.isArray(pageProps.exchanges)) {
              currentItem = pageProps.exchanges.find(exchange => 
                exchange.slug && (currentPath.includes(exchange.slug) || currentPath.endsWith(exchange.slug))
              );
              if (currentItem) {
                contentType = "exchanges";
              }
            }
            
            if (!currentItem && pageProps?.exchange && Array.isArray(pageProps.exchange)) {
              currentItem = pageProps.exchange.find(exchange => 
                exchange.slug && (currentPath.includes(exchange.slug) || currentPath.endsWith(exchange.slug))
              );
              if (currentItem) {
                contentType = "exchanges";
              }
            }
            
            if (!currentItem && pageProps?.ogs && Array.isArray(pageProps.ogs)) {
              currentItem = pageProps.ogs.find(og => 
                og.slug && (currentPath.includes(og.slug) || currentPath.endsWith(og.slug))
              );
              if (currentItem) {
                contentType = "crypto-ogs";
              }
            }
            
            if (!currentItem && pageProps?.og && Array.isArray(pageProps.og)) {
              currentItem = pageProps.og.find(og => 
                og.slug && (currentPath.includes(og.slug) || currentPath.endsWith(og.slug))
              );
              if (currentItem) {
                contentType = "crypto-ogs";
              }
            }
            
            if (currentItem && currentItem.frontmatter) {
              const frontmatter = currentItem.frontmatter;
              const baseUrl = window.location.origin;
              
              const extractedContent = extractPageContent();
              
              let finalContent = extractedContent;
              if (!finalContent && currentItem.content) {
                finalContent = currentItem.content;
              }
              
              const metadata = {
                title: frontmatter.title || "Unknown Title",
                description: frontmatter.description || "No description available",
                image: frontmatter.image ? baseUrl + frontmatter.image : "",
                contentType: contentType || "posts",
                slug: currentItem.slug,
                content: finalContent,
                url: currentUrl
              };
              
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'METADATA_EXTRACTED',
                metadata: metadata
              }));
            } else {
              const metaTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                              document.querySelector('meta[name="title"]')?.getAttribute('content');
              
              const metaDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                                    document.querySelector('meta[name="description"]')?.getAttribute('content');
              
              const metaImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                              document.querySelector('meta[name="image"]')?.getAttribute('content');
              
              if (metaTitle || metaDescription) {
                const fallbackMetadata = {
                  title: metaTitle || "Unknown Title",
                  description: metaDescription || "No description available",
                  image: metaImage || "",
                  contentType: contentType || "unknown",
                  slug: currentItem?.slug || window.location.pathname.split('/').pop() || "unknown",
                  content: extractPageContent(),
                  url: currentUrl
                };
                
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'METADATA_EXTRACTED',
                  metadata: fallbackMetadata
                }));
              } else {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'METADATA_EXTRACTED',
                  metadata: null
                }));
              }
            }
          } else {
            const metaTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                            document.querySelector('meta[name="title"]')?.getAttribute('content');
            
            const metaDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                                  document.querySelector('meta[name="description"]')?.getAttribute('content');
            
            const metaImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                            document.querySelector('meta[name="image"]')?.getAttribute('content');
            
            if (metaTitle || metaDescription) {
              const fallbackMetadata = {
                title: metaTitle || "Unknown Title",
                description: metaDescription || "No description available",
                image: metaImage || "",
                contentType: "unknown",
                slug: window.location.pathname.split('/').pop() || "unknown",
                content: extractPageContent(),
                url: currentUrl
              };
              
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'METADATA_EXTRACTED',
                metadata: fallbackMetadata
              }));
            } else {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'METADATA_EXTRACTED',
                metadata: null
              }));
            }
          }
        } catch (error) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'METADATA_EXTRACTED',
            metadata: null
          }));
        }
      })();
      true;
    `;
  }

  private static async processPageData(
    extractedMetadata: any,
    currentPageSlug: string | null,
    currentUrl: string
  ): Promise<any> {
    let cachedImagePath = extractedMetadata.image || "";
    if (extractedMetadata.image && currentPageSlug) {
      try {
        const localPath = await ImageCache.downloadAndCacheImage(
          extractedMetadata.image,
          currentPageSlug
        );
        if (localPath) {
          try {
            const base64Data = await FileSystem.readAsStringAsync(localPath, {
              encoding: FileSystem.EncodingType.Base64,
            });

            const extension =
              extractedMetadata.image.split(".").pop()?.toLowerCase() || "jpg";
            const mimeType =
              extension === "png"
                ? "image/png"
                : extension === "gif"
                ? "image/gif"
                : extension === "webp"
                ? "image/webp"
                : "image/jpeg";

            cachedImagePath = `data:${mimeType};base64,${base64Data}`;
          } catch (error) {
            cachedImagePath = localPath;
          }
        }
      } catch {}
    }

    let processedContent =
      extractedMetadata.content ||
      `<h1>${extractedMetadata.title || "Saved Content"}</h1><p>${
        extractedMetadata.description || "Content saved for offline viewing"
      }</p>`;

    const imgRegex = /<img[^>]+src="([^"]*)"[^>]*>/gi;
    let match;
    let imageCount = 0;

    while ((match = imgRegex.exec(processedContent)) !== null) {
      const fullImgTag = match[0];
      const imgSrc = match[1];

      imageCount++;

      if (imgSrc && imgSrc.startsWith("/images/")) {
        const fullImageUrl = "https://www.thecrypto.wiki" + imgSrc;

        try {
          const cachedPath = await ImageCache.downloadAndCacheImage(
            fullImageUrl,
            "content-image"
          );

          if (cachedPath) {
            try {
              const base64Data = await FileSystem.readAsStringAsync(
                cachedPath,
                {
                  encoding: FileSystem.EncodingType.Base64,
                }
              );

              const extension = imgSrc.split(".").pop()?.toLowerCase() || "jpg";
              const mimeType =
                extension === "png"
                  ? "image/png"
                  : extension === "gif"
                  ? "image/gif"
                  : extension === "webp"
                  ? "image/webp"
                  : "image/jpeg";

              const dataUrl = `data:${mimeType};base64,${base64Data}`;

              const newImgTag = fullImgTag.replace(imgSrc, dataUrl);
              processedContent = processedContent.replace(
                fullImgTag,
                newImgTag
              );
            } catch (error) {
              const newImgTag = fullImgTag.replace(imgSrc, cachedPath);
              processedContent = processedContent.replace(
                fullImgTag,
                newImgTag
              );
            }
          }
        } catch (error) {}
      }
    }

    return {
      title: extractedMetadata.title || "Unknown Title",
      description: extractedMetadata.description || "No description available",
      image: cachedImagePath,
      url: currentUrl,
      content: processedContent,
      publishedDate: extractedMetadata.publishedDate || "",
      author: extractedMetadata.author || "",
    };
  }
}

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import {
  SavedContentStorage,
  SavedContent,
  isDetailPageUrl,
  getContentTypeFromUrl,
  extractSlugFromUrl,
} from "@/utils/savedContentStorage";

interface SavedContentContextType {
  currentUrl: string;
  isCurrentPageSaveable: boolean;
  isCurrentPageSaved: boolean;
  currentPageType: SavedContent["type"] | null;
  currentPageSlug: string | null;

  savedCounts: {
    posts: number;
    exchanges: number;
    "crypto-ogs": number;
  };

  setCurrentUrl: (url: string) => void;
  saveCurrentPage: (
    pageData?: Partial<Omit<SavedContent, "id" | "type" | "slug" | "savedAt">>
  ) => Promise<boolean>;
  removeSavedContent: (
    type: SavedContent["type"],
    id: string
  ) => Promise<boolean>;
  refreshSavedCounts: () => Promise<void>;
  checkIfCurrentPageSaved: () => Promise<void>;
  forceRefreshSavedState: () => Promise<void>;
}

const SavedContentContext = createContext<SavedContentContextType | undefined>(
  undefined
);

interface SavedContentProviderProps {
  children: ReactNode;
}

export function SavedContentProvider({ children }: SavedContentProviderProps) {
  const [currentUrl, setCurrentUrlState] = useState<string>("");
  const [isCurrentPageSaved, setIsCurrentPageSaved] = useState<boolean>(false);
  const [savedCounts, setSavedCounts] = useState({
    posts: 0,
    exchanges: 0,
    "crypto-ogs": 0,
  });

  const isCurrentPageSaveable = currentUrl
    ? isDetailPageUrl(currentUrl)
    : false;
  const currentPageType = currentUrl ? getContentTypeFromUrl(currentUrl) : null;
  const currentPageSlug = currentUrl ? extractSlugFromUrl(currentUrl) : null;

  const setCurrentUrl = useCallback(async (url: string) => {
    if (!url || typeof url !== "string" || url.trim() === "") {
      setCurrentUrlState("");
      setIsCurrentPageSaved(false);
      return;
    }

    setCurrentUrlState(url);

    if (isDetailPageUrl(url)) {
      const isSaved = await SavedContentStorage.isContentSavedByUrl(url);
      setIsCurrentPageSaved(isSaved);
    } else {
      setIsCurrentPageSaved(false);
    }
  }, []);

  const checkIfCurrentPageSaved = useCallback(async () => {
    if (isCurrentPageSaveable && currentUrl) {
      const isSaved = await SavedContentStorage.isContentSavedByUrl(currentUrl);
      setIsCurrentPageSaved(isSaved);
    } else {
      setIsCurrentPageSaved(false);
    }
  }, [isCurrentPageSaveable, currentUrl]);

  const forceRefreshSavedState = useCallback(async () => {
    await checkIfCurrentPageSaved();
  }, [checkIfCurrentPageSaved]);

  const saveCurrentPage = useCallback(
    async (
      pageData?: Partial<Omit<SavedContent, "id" | "type" | "slug" | "savedAt">>
    ): Promise<boolean> => {
      try {
        if (!currentPageType || !currentPageSlug || !currentUrl) {
          return false;
        }

        if (pageData?.url && pageData.url !== currentUrl) {
          return false;
        }

        const alreadySaved = await SavedContentStorage.isContentSavedByUrl(
          currentUrl
        );
        if (alreadySaved) {
        }

        let extractedData: Partial<SavedContent> = {};

        const finalData = {
          title: "Saved Content",
          description: "This page has been saved for offline viewing",
          image: "",
          url: currentUrl,
          content: "<p>Content will be extracted from webview</p>",
          ...pageData,
        };

        const savedContent: SavedContent = {
          id: currentPageSlug,
          type: currentPageType,
          slug: currentPageSlug,
          savedAt: new Date().toISOString(),
          ...finalData,
        };

        await SavedContentStorage.saveContent(savedContent);
        setIsCurrentPageSaved(true);
        await refreshSavedCounts();

        return true;
      } catch (error) {
        return false;
      }
    },
    [currentPageType, currentPageSlug, currentUrl]
  );

  const removeSavedContent = useCallback(
    async (type: SavedContent["type"], id: string): Promise<boolean> => {
      try {
        await SavedContentStorage.removeSavedContent(type, id);

        if (type === currentPageType && id === currentPageSlug && currentUrl) {
          setIsCurrentPageSaved(false);
        }

        await refreshSavedCounts();
        return true;
      } catch (error) {
        return false;
      }
    },
    [currentPageType, currentPageSlug, currentUrl]
  );

  const refreshSavedCounts = useCallback(async () => {
    try {
      const counts = await SavedContentStorage.getAllSavedContentCounts();
      setSavedCounts(counts);
    } catch (error) {}
  }, []);

  useEffect(() => {
    refreshSavedCounts();
  }, [refreshSavedCounts]);

  useEffect(() => {
    checkIfCurrentPageSaved();
  }, [checkIfCurrentPageSaved]);

  const value: SavedContentContextType = {
    currentUrl,
    isCurrentPageSaveable,
    isCurrentPageSaved,
    currentPageType,
    currentPageSlug,
    savedCounts,
    setCurrentUrl,
    saveCurrentPage,
    removeSavedContent,
    refreshSavedCounts,
    checkIfCurrentPageSaved,
    forceRefreshSavedState,
  };

  return (
    <SavedContentContext.Provider value={value}>
      {children}
    </SavedContentContext.Provider>
  );
}

export function useSavedContent() {
  const context = useContext(SavedContentContext);
  if (context === undefined) {
    throw new Error(
      "useSavedContent must be used within a SavedContentProvider"
    );
  }
  return context;
}

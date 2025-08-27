import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
} from "react";
import Loader from "@/components/ui/Loader";

type LoaderContextType = {
  showLoader: () => void;
  hideLoader: () => void;
  showLoaderMin: (minDelay?: number) => void;
  hideLoaderMin: () => void;
  isContentVisible: boolean;
};

const LoaderContext = createContext<LoaderContextType>({
  showLoader: () => {},
  hideLoader: () => {},
  showLoaderMin: () => {},
  hideLoaderMin: () => {},
  isContentVisible: true,
});

type LoaderProviderProps = {
  children: ReactNode;
};

export const LoaderProvider = ({ children }: LoaderProviderProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(true);
  const loaderStartTime = useRef<number | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showLoader = () => setIsLoading(true);
  const hideLoader = () => setIsLoading(false);

  const showLoaderMin = (minDelay: number = 800) => {
    // Clear any existing timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    loaderStartTime.current = Date.now();
    setIsLoading(true);
    setIsContentVisible(false);
  };

  const hideLoaderMin = () => {
    if (!loaderStartTime.current) {
      setIsLoading(false);
      setIsContentVisible(true);
      return;
    }

    const elapsedTime = Date.now() - loaderStartTime.current;
    const minDelay = 800; // 800ms minimum delay

    if (elapsedTime >= minDelay) {
      setIsLoading(false);
      setIsContentVisible(true);
      loaderStartTime.current = null;
    } else {
      const remainingTime = minDelay - elapsedTime;
      hideTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        setIsContentVisible(true);
        loaderStartTime.current = null;
        hideTimeoutRef.current = null;
      }, remainingTime);
    }
  };

  return (
    <LoaderContext.Provider
      value={{
        showLoader,
        hideLoader,
        showLoaderMin,
        hideLoaderMin,
        isContentVisible,
      }}
    >
      {children}
      {isLoading && <Loader />}
    </LoaderContext.Provider>
  );
};

export const useLoader = () => useContext(LoaderContext);

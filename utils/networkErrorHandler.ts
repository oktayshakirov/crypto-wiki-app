let markAsOfflineCallback: (() => void) | null = null;

export const setMarkAsOfflineCallback = (callback: () => void) => {
  markAsOfflineCallback = callback;
};

export const handleNetworkError = (error: any) => {
  if (error && (error.code === -1009 || error.message?.includes("offline"))) {
    if (markAsOfflineCallback) {
      markAsOfflineCallback();
    }
  }
};

export const createNetworkErrorHandler = () => {
  return (error: any) => handleNetworkError(error);
};

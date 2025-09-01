import React from "react";
import { Alert } from "react-native";

interface RemoveContentDialogProps {
  contentType: "posts" | "exchanges" | "crypto-ogs";
  onRemove: () => Promise<boolean>;
  onSuccess?: () => void;
  onError?: () => void;
}

export const RemoveContentDialog = {
  show: ({
    contentType,
    onRemove,
    onSuccess,
    onError,
  }: RemoveContentDialogProps) => {
    let alertTitle = "Remove Content";
    let alertMessage = "Are you sure you want to remove this saved content?";

    if (contentType === "posts") {
      alertTitle = "Remove Post";
      alertMessage = "Are you sure you want to remove this saved post?";
    } else if (contentType === "exchanges") {
      alertTitle = "Remove Exchange";
      alertMessage = "Are you sure you want to remove this saved exchange?";
    } else if (contentType === "crypto-ogs") {
      alertTitle = "Remove OG";
      alertMessage =
        "Are you sure you want to remove this saved crypto pioneer?";
    }

    Alert.alert(alertTitle, alertMessage, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            const success = await onRemove();
            if (success) {
              onSuccess?.();
            } else {
              onError?.();
            }
          } catch (error) {
            onError?.();
          }
        },
      },
    ]);
  },
};

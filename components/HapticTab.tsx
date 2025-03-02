import React from "react";
import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import { useRefresh } from "@/contexts/RefreshContext";

interface HapticTabProps extends BottomTabBarButtonProps {
  refreshKey: string;
}

export function HapticTab(props: HapticTabProps) {
  const { refreshKey, ...rest } = props;
  const { triggerRefresh } = useRefresh(refreshKey);

  const handlePress = (ev: any) => {
    if (props.accessibilityState?.selected) {
      triggerRefresh();
    } else {
      props.onPress?.(ev);
    }
  };

  return (
    <PlatformPressable
      {...rest}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
      onPress={handlePress}
    />
  );
}

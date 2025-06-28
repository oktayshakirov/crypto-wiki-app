import React from "react";
import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import { useRefresh } from "@/contexts/RefreshContext";
import { useNavigationState } from "@react-navigation/native";

interface HapticTabProps extends BottomTabBarButtonProps {
  refreshKey: string;
}

export function HapticTab(props: HapticTabProps) {
  const { refreshKey, ...rest } = props;
  const { triggerRefresh } = useRefresh(refreshKey);

  const currentRouteIndex = useNavigationState((state) => state?.index ?? 0);

  const getTabIndex = (key: string) => {
    const tabOrder = ["home", "posts", "exchanges", "ogs", "tools"];
    return tabOrder.indexOf(key);
  };

  const tabIndex = getTabIndex(refreshKey);
  const isSelected = tabIndex === currentRouteIndex;

  const handlePress = (ev: any) => {
    if (isSelected) {
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

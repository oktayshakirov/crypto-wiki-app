import React from "react";
import { View, StyleSheet } from "react-native";

export default function TabBarBackground() {
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: "#3E2542",
        },
      ]}
    />
  );
}

export function useBottomTabOverflow() {
  return 0;
}

import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { openBrowserAsync } from "expo-web-browser";
import { Colors } from "@/constants/Colors";

interface ExternalLinkProps {
  href: string;
  children: React.ReactNode;
  style?: any;
}

export default function ExternalLink({
  href,
  children,
  style,
}: ExternalLinkProps) {
  return (
    <TouchableOpacity
      onPress={() => {
        openBrowserAsync(href);
      }}
      style={[styles.link, style]}
    >
      <Text style={styles.text}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  link: {
    textDecorationLine: "underline",
  },
  text: {
    color: Colors.highlight,
  },
});

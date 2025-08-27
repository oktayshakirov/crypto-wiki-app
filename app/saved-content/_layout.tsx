import React from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/Fontisto";
import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import Header from "@/components/Header";

export default function SavedContentLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Header />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.activeIcon,
          tabBarInactiveTintColor: Colors.icon,
          headerShown: false,
          tabBarLabelPosition: "below-icon",
          tabBarBackground: TabBarBackground,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
          },
          tabBarStyle: Platform.select({
            ios: { position: "absolute" },
            default: {},
          }),
        }}
      >
        <Tabs.Screen
          name="saved-posts"
          options={{
            title: "Saved Posts",
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="quote-a-left" size={23} color={color} />
            ),
            tabBarButton: (props) => (
              <HapticTab {...props} refreshKey="saved-posts" />
            ),
          }}
        />

        <Tabs.Screen
          name="saved-exchanges"
          options={{
            title: "Saved Exchanges",
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="bitcoin" size={23} color={color} />
            ),
            tabBarButton: (props) => (
              <HapticTab {...props} refreshKey="saved-exchanges" />
            ),
          }}
        />

        <Tabs.Screen
          name="saved-ogs"
          options={{
            title: "Saved OG's",
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="persons" size={23} color={color} />
            ),
            tabBarButton: (props) => (
              <HapticTab {...props} refreshKey="saved-ogs" />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

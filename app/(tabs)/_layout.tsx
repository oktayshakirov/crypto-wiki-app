import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/Fontisto";
import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";

export default function TabLayout() {
  return (
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
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={23} color={color} />
          ),
          tabBarButton: (props) => <HapticTab {...props} refreshKey="home" />,
        }}
      />

      <Tabs.Screen
        name="posts"
        options={{
          title: "Posts",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="quote-a-left" size={23} color={color} />
          ),
          tabBarButton: (props) => <HapticTab {...props} refreshKey="posts" />,
        }}
      />

      <Tabs.Screen
        name="exchanges"
        options={{
          title: "Exchanges",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="music-note" size={23} color={color} />
          ),
          tabBarButton: (props) => <HapticTab {...props} refreshKey="sounds" />,
        }}
      />

      <Tabs.Screen
        name="ogs"
        options={{
          title: "OG's",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="hashtag" size={23} color={color} />
          ),
          tabBarButton: (props) => <HapticTab {...props} refreshKey="tags" />,
        }}
      />
    </Tabs>
  );
}

import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/Fontisto";
import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import Header from "@/components/Header";

export default function TabLayout() {
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
            tabBarButton: (props) => (
              <HapticTab {...props} refreshKey="posts" />
            ),
          }}
        />

        <Tabs.Screen
          name="exchanges"
          options={{
            title: "Exchanges",
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="bitcoin" size={23} color={color} />
            ),
            tabBarButton: (props) => (
              <HapticTab {...props} refreshKey="exchanges" />
            ),
          }}
        />

        <Tabs.Screen
          name="ogs"
          options={{
            title: "OG's",
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="persons" size={23} color={color} />
            ),
            tabBarButton: (props) => <HapticTab {...props} refreshKey="ogs" />,
          }}
        />

        <Tabs.Screen
          name="tools"
          options={{
            title: "Tools",
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="pie-chart-2" size={23} color={color} />
            ),
            tabBarButton: (props) => (
              <HapticTab {...props} refreshKey="tools" />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

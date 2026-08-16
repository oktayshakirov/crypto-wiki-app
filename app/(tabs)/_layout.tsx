import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/Fontisto";
import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/TabBarBackground";
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
            android: {
              position: "absolute",
              height: "auto",
            },
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
          name="videos"
          options={{
            title: "Videos",
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="play" size={23} color={color} />
            ),
            tabBarButton: (props) => (
              <HapticTab {...props} refreshKey="videos" />
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

        {/* Tools moved to the header menu when Videos arrived: six tabs put
            "Exchanges" past the label width a 375pt phone can give it, and a
            utility section survives that demotion better than a content one.
            `href: null` keeps /tools routable - the menu, and any link to it,
            still work - it only leaves the bar. */}
        <Tabs.Screen name="tools" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

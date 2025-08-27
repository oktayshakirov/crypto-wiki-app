import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import { Colors } from "@/constants/Colors";
import MaterialIcons from "@expo/vector-icons/Fontisto";
import { useRefresh } from "@/contexts/RefreshContext";
import { useSegments, useRouter } from "expo-router";

const { width } = Dimensions.get("window");

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuAnimation] = useState(new Animated.Value(0));
  const router = useRouter();

  const segments = useSegments();
  const currentRoute = segments[segments.length - 1] || "index";
  const parentRoute = segments[segments.length - 2] || "";

  // Handle nested routes like saved-content/saved-posts
  const getCurrentRouteKey = () => {
    if (parentRoute === "saved-content") {
      return currentRoute; // This will be saved-posts, saved-exchanges, or saved-ogs
    }
    return currentRoute;
  };

  const { triggerRefresh } = useRefresh(
    getRefreshKey(getCurrentRouteKey()) || "home"
  );

  function getRefreshKey(route: string) {
    switch (route) {
      case "index":
        return "home";
      case "posts":
        return "posts";
      case "exchanges":
        return "exchanges";
      case "ogs":
        return "ogs";
      case "tools":
        return "tools";
      case "saved-content":
        return "saved-posts";
      case "saved-posts":
        return "saved-posts";
      case "saved-exchanges":
        return "saved-exchanges";
      case "saved-ogs":
        return "saved-ogs";
      default:
        return "home";
    }
  }

  const toggleMenu = () => {
    const toValue = isMenuOpen ? 0 : 1;
    setIsMenuOpen(!isMenuOpen);

    Animated.timing(menuAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const menuTranslateY = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });

  const menuOpacity = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const menuItems = [
    {
      label: "Saved Posts",
      icon: "quote-a-left",
      route: "/saved-content/saved-posts",
      count: 5,
    },
    {
      label: "Saved Exchanges",
      icon: "bitcoin",
      route: "/saved-content/saved-exchanges",
      count: 3,
    },
    {
      label: "Saved OG's",
      icon: "persons",
      route: "/saved-content/saved-ogs",
      count: 8,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.logoContainer}
          onPress={() => {
            // If we're on a saved content page, go back to home, otherwise refresh
            if (parentRoute === "saved-content") {
              router.push("/(tabs)/");
            } else {
              triggerRefresh();
            }
          }}
          activeOpacity={0.7}
        >
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bookmarkButton}
          onPress={() => {
            // TODO: Implement save content functionality
            console.log("Bookmark button pressed");
          }}
          activeOpacity={0.7}
        >
          <MaterialIcons name="download" size={24} color={Colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={toggleMenu}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name={isMenuOpen ? "close-a" : "folder"}
            size={24}
            color={Colors.text}
          />
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.menu,
          {
            transform: [{ translateY: menuTranslateY }],
            opacity: menuOpacity,
          },
        ]}
      >
        <View style={styles.menuContent}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => {
                router.push(item.route);
                toggleMenu();
              }}
            >
              <MaterialIcons
                name={item.icon as any}
                size={18}
                color={Colors.activeIcon}
                style={styles.menuIcon}
              />
              <Text style={styles.menuText}>{item.label}</Text>
              <Text style={styles.menuCount}>({item.count})</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {isMenuOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1000,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logo: {
    width: 200,
    height: 40,
  },
  bookmarkButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
  },
  menu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderColor: "#333",
    borderRadius: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuContent: {
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  menuIcon: {
    marginRight: 15,
    width: 24,
    height: 20,
    textAlign: "center",
  },
  menuText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: "500",
    flex: 1,
  },
  menuCount: {
    fontSize: 14,
    color: Colors.icon,
    fontWeight: "600",
    marginLeft: 8,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: -1,
  },
});

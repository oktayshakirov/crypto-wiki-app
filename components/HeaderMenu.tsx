import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { Colors } from "@/constants/Colors";
import MaterialIcons from "@expo/vector-icons/Fontisto";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

interface HeaderMenuProps {
  savedCounts: {
    posts: number;
    exchanges: number;
    "crypto-ogs": number;
  };
}

export default function HeaderMenu({ savedCounts }: HeaderMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuAnimation] = useState(new Animated.Value(0));
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const router = useRouter();

  const toggleMenu = () => {
    const toValue = isMenuOpen ? 0 : 1;
    setIsMenuOpen(!isMenuOpen);

    if (!isMenuOpen) {
      setIsMenuVisible(true);
    }

    Animated.timing(menuAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      if (toValue === 0) {
        setIsMenuVisible(false);
      }
    });
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
      count: savedCounts.posts,
    },
    {
      label: "Saved Exchanges",
      icon: "bitcoin",
      route: "/saved-content/saved-exchanges",
      count: savedCounts.exchanges,
    },
    {
      label: "Saved OG's",
      icon: "persons",
      route: "/saved-content/saved-ogs",
      count: savedCounts["crypto-ogs"],
    },
  ];

  return (
    <>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={toggleMenu}
        activeOpacity={0.7}
      >
        <MaterialIcons
          name={isMenuOpen ? "close-a" : "nav-icon-list"}
          size={24}
          color={Colors.text}
        />
        {!isMenuOpen && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>
              {savedCounts.posts +
                savedCounts.exchanges +
                savedCounts["crypto-ogs"]}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {isMenuVisible && (
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
      )}

      {isMenuVisible && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    padding: 8,
    borderRadius: 8,
    position: "relative",
  },
  badgeContainer: {
    position: "absolute",
    top: 4,
    right: 0,
    backgroundColor: Colors.activeIcon,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
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
    zIndex: 1000,
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
    top: -height,
    left: -width,
    width: width * 2,
    height: height * 2,
    backgroundColor: "transparent",
    zIndex: 999,
  },
});

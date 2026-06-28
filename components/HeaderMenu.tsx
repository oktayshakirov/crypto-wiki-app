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
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRevenueCat } from "@/contexts/RevenueCatContext";
import PlanModal from "@/components/PlanModal";
import ConnectModal from "@/components/ConnectModal";

const { width, height } = Dimensions.get("window");

interface HeaderMenuProps {
  savedCounts: {
    posts: number;
    exchanges: number;
    "crypto-ogs": number;
  };
}

type MenuItem = {
  label: string;
  // Either a Fontisto icon (existing items) or an Ionicons icon (new items)
  icon?: string;
  ionicon?: React.ComponentProps<typeof Ionicons>["name"];
  iconColor?: string;
  route?: string;
  action?: () => void;
  count?: number | null;
};

export default function HeaderMenu({ savedCounts }: HeaderMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuAnimation] = useState(new Animated.Value(0));
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [planVisible, setPlanVisible] = useState(false);
  const [connectVisible, setConnectVisible] = useState(false);
  const router = useRouter();
  const { isPro } = useRevenueCat();

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

  const menuItems: MenuItem[] = [
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
    {
      label: "Connect with Us",
      ionicon: "chatbubble-ellipses",
      iconColor: Colors.activeIcon,
      action: () => setConnectVisible(true),
      count: null,
    },
    {
      label: isPro ? "Manage Plan" : "Upgrade to Pro",
      ionicon: "star",
      iconColor: Colors.activeIcon,
      action: () => setPlanVisible(true),
      count: null,
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
                  if (item.route) {
                    router.push(item.route);
                  } else if (item.action) {
                    item.action();
                  }
                  toggleMenu();
                }}
              >
                {item.ionicon ? (
                  <Ionicons
                    name={item.ionicon}
                    size={18}
                    color={item.iconColor ?? Colors.activeIcon}
                    style={styles.menuIcon}
                  />
                ) : (
                  <MaterialIcons
                    name={item.icon as any}
                    size={18}
                    color={item.iconColor ?? Colors.activeIcon}
                    style={styles.menuIcon}
                  />
                )}
                <Text style={styles.menuText}>{item.label}</Text>
                {typeof item.count === "number" && (
                  <Text style={styles.menuCount}>({item.count})</Text>
                )}
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

      <PlanModal
        visible={planVisible}
        onClose={() => setPlanVisible(false)}
      />
      <ConnectModal
        visible={connectVisible}
        onClose={() => setConnectVisible(false)}
      />
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
    right: -5,
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

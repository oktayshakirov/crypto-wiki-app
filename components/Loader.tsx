import React from "react";
import { View, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";

const Loader = () => {
  return (
    <View style={styles.loaderWrapper}>
      <LottieView
        source={require("@/assets/animations/loader.json")}
        autoPlay
        loop
        style={styles.lottie}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loaderWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  lottie: {
    width: 150,
    height: 150,
  },
});

export default Loader;

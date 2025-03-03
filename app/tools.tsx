import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";

export default function ToolsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crypto Tools</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 16,
  },
});

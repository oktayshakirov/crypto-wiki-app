import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

async function registerPushTokenOnServer(token: string) {
  try {
    await fetch("https://registerpushtoken-7p7ces4mpq-uc.a.run.app", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  } catch (error) {}
}

export async function getOrRegisterPushToken(): Promise<string | null> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: "your-project-id",
    });

    if (token.data) {
      await fetch("https://registerpushtoken-7p7ces4mpq-uc.a.run.app", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: token.data }),
      });

      const storedToken = await AsyncStorage.getItem("@push_token");
      if (storedToken === token.data) {
        return token.data;
      }

      await AsyncStorage.setItem("@push_token", token.data);
      return token.data;
    }

    return null;
  } catch (error) {
    return null;
  }
}

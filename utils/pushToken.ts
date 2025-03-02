import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

async function registerPushTokenOnServer(token: string) {
  try {
    await fetch("https://registerpushtoken-culutsb2da-uc.a.run.app", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    console.log("Push token registered on server:", token);
  } catch (error) {
    console.error("Error registering push token on server:", error);
  }
}

export async function getOrRegisterPushToken(): Promise<string | null> {
  try {
    let storedToken = await AsyncStorage.getItem("pushToken");
    if (storedToken) {
      console.log("Token already registered:", storedToken);
      return storedToken;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      console.warn("Permission for push notifications was not granted");
      return null;
    }

    const { data: newToken } = await Notifications.getExpoPushTokenAsync();
    if (!newToken) {
      console.warn("No push token returned from Expo");
      return null;
    }

    await AsyncStorage.setItem("pushToken", newToken);
    await registerPushTokenOnServer(newToken);

    return newToken;
  } catch (error) {
    console.error("Error in getOrRegisterPushToken:", error);
    return null;
  }
}

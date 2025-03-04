import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { db } from "../config/FirebaseConfig";
import { collection, addDoc, setDoc, doc } from "firebase/firestore";

export async function registerForPushNotificationsAsync(userId?: string) {
  if (!Device.isDevice) {
    alert("Must use a physical device for push notifications");
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    alert("Failed to get push token for push notifications!");
    return;
  }

  const token = (
    await Notifications.getExpoPushTokenAsync({
      projectId: "21761514-c6bd-4a35-9ef1-a85c0f4b6f09",
    })
  ).data;

  if (userId) {
    await setDoc(doc(db, "pushTokens", userId), { token });
  } else {
    await addDoc(collection(db, "pushTokens"), { token });
  }

  return token;
}

export async function scheduleLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: body,
      sound: "default",
    },
    trigger: null,
  });
}

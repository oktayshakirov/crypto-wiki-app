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
      projectId: "274da90d-795f-4715-8c0e-f215c3dc85ee",
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

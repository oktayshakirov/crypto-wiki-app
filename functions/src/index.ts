/* eslint-disable */
import * as admin from "firebase-admin";
import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { Request, Response } from "express";
import { Change, FirestoreEvent } from "firebase-functions/v2";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();
const expo = new Expo();

export const registerPushToken = onRequest(
  async (req: Request, res: Response) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const { token } = req.body;
    if (!token) {
      res.status(400).send("Missing push token");
      return;
    }

    try {
      await db.collection("pushTokens").doc(token).set(
        {
          token,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      res
        .status(200)
        .json({ message: "Push token registered/updated successfully." });
    } catch (error) {
      console.error("Error registering push token:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

async function sendPushNotification(
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<void> {
  const tokensSnapshot = await db.collection("pushTokens").get();

  const tokenSet = new Set<string>();
  tokensSnapshot.forEach((doc: QueryDocumentSnapshot) => {
    const token = doc.data().token;
    if (Expo.isExpoPushToken(token)) {
      tokenSet.add(token);
    } else {
      console.error(`Push token ${token} is not a valid Expo push token`);
    }
  });

  const messages: ExpoPushMessage[] = Array.from(tokenSet).map((token) => ({
    to: token,
    title,
    body,
    data,
  }));

  if (messages.length === 0) {
    console.log("No valid push tokens to send notifications to.");
    return;
  }

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log("Notification tickets:", ticketChunk);
    } catch (error) {
      console.error("Error sending notification chunk:", error);
    }
  }
}

export const sendNewPostNotification = onDocumentCreated(
  "posts/{postId}",
  async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
    try {
      const snap = event.data!;
      const postData = snap.data() as { title?: string } | undefined;
      const postTitle = postData?.title || "New Post";

      const title = "New Post on TheCrypto.wiki";
      const body = postTitle;

      await sendPushNotification(title, body);
    } catch (error) {
      console.error("Error in sendNewPostNotification:", error);
    }
  }
);

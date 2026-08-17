/* eslint-disable */
import * as admin from "firebase-admin";
import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onRequest } from "firebase-functions/v2/https";

export { getWidgetData, getWidgetContent, getWidgetHeatmap } from "./widgets";

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();
const expo = new Expo();

// maxInstances caps concurrent containers so an abuse spike on this open
// endpoint cannot run up an unbounded bill.
export const registerPushToken = onRequest({ maxInstances: 10 }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const { token } = req.body;
  if (!token) {
    res.status(400).send("Missing push token");
    return;
  }

  // Validate before storing, not just before sending. Every document in this
  // collection is read on every notification, so letting junk in here raises the
  // cost of every future send - and nothing ever removed it.
  if (!Expo.isExpoPushToken(token)) {
    console.warn("Rejected registration for a non-Expo push token");
    res.status(400).send("Invalid push token");
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
});

const SITE_URL = "https://www.thecrypto.wiki";

/**
 * Documents are keyed by slug, so editing a post's title updates the existing
 * document instead of creating a new one. The `notify` flag is set by the
 * blog's sync script, which is the single source of truth for what counts as
 * genuinely new content. Firestore triggers are at-least-once, so `notifiedAt`
 * guards against a retry sending the same notification twice.
 */
async function claimNotification(
  ref: FirebaseFirestore.DocumentReference,
  data: { notify?: boolean; notifiedAt?: unknown } | undefined
): Promise<boolean> {
  if (data?.notify !== true) {
    return false;
  }

  try {
    return await db.runTransaction(async (tx) => {
      const fresh = await tx.get(ref);
      if (!fresh.exists || fresh.data()?.notifiedAt) {
        return false;
      }
      tx.update(ref, {
        notifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return true;
    });
  } catch (error) {
    console.error("Error claiming notification:", error);
    return false;
  }
}

async function sendPushNotification(
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<void> {
  const tokensSnapshot = await db.collection("pushTokens").get();

  const tokenSet = new Set<string>();
  tokensSnapshot.forEach((doc) => {
    const token = doc.data().token;
    if (Expo.isExpoPushToken(token)) {
      tokenSet.add(token);
    } else {
      console.error(`Push token ${token} is not a valid Expo push token`);
    }
  });

  const messages: ExpoPushMessage[] = Array.from(tokenSet).map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data,
  }));

  if (messages.length === 0) {
    console.log("No valid push tokens to send notifications to.");
    return;
  }

  const chunks = expo.chunkPushNotifications(messages);
  const deadTokens: string[] = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);

      // Tickets come back in the same order as the messages sent, so index
      // correlation is what maps a failure back to the token that caused it.
      ticketChunk.forEach((ticket, index) => {
        if (ticket.status !== "error") {
          return;
        }
        if (ticket.details?.error === "DeviceNotRegistered") {
          deadTokens.push(chunk[index].to as string);
        } else {
          console.error("Push ticket error:", ticket.message, ticket.details);
        }
      });
    } catch (error) {
      console.error("Error sending notification chunk:", error);
    }
  }

  await removeDeadTokens(deadTokens);
}

/**
 * Deletes tokens Expo has told us belong to uninstalled apps.
 *
 * Nothing used to remove them, so the collection only ever grew - and since
 * every notification reads the whole collection, each uninstalled device kept
 * costing a read on every send, forever, while never receiving anything.
 */
async function removeDeadTokens(tokens: string[]): Promise<void> {
  if (tokens.length === 0) {
    return;
  }

  // Firestore caps a batch at 500 writes.
  const BATCH_LIMIT = 500;
  try {
    for (let i = 0; i < tokens.length; i += BATCH_LIMIT) {
      const batch = db.batch();
      for (const token of tokens.slice(i, i + BATCH_LIMIT)) {
        batch.delete(db.collection("pushTokens").doc(token));
      }
      await batch.commit();
    }
    console.log(`Removed ${tokens.length} unregistered push token(s).`);
  } catch (error) {
    console.error("Error removing dead push tokens:", error);
  }
}

type ContentDoc =
  | { title?: string; slug?: string; notify?: boolean }
  | undefined;

export const sendNewPostNotification = onDocumentCreated(
  "posts/{postId}",
  async (event) => {
    try {
      const snap = event.data!;
      const postData = snap.data() as ContentDoc;

      if (!(await claimNotification(snap.ref, postData))) {
        return;
      }

      const slug = postData?.slug || event.params.postId;

      await sendPushNotification(
        "New Post on CryptoWiki",
        postData?.title || "New Post",
        {
          type: "post",
          slug,
          url: `${SITE_URL}/posts/${slug}`,
        }
      );
    } catch (error) {
      console.error("Error in sendNewPostNotification:", error);
    }
  }
);

export const sendNewExchangeNotification = onDocumentCreated(
  "exchanges/{exchangeId}",
  async (event) => {
    try {
      const snap = event.data!;
      const exchangeData = snap.data() as ContentDoc;

      if (!(await claimNotification(snap.ref, exchangeData))) {
        return;
      }

      const slug = exchangeData?.slug || event.params.exchangeId;

      await sendPushNotification(
        "New Exchange on CryptoWiki",
        exchangeData?.title || "New Exchange",
        {
          type: "exchange",
          slug,
          url: `${SITE_URL}/exchanges/${slug}`,
        }
      );
    } catch (error) {
      console.error("Error in sendNewExchangeNotification:", error);
    }
  }
);

export const sendNewOGNotification = onDocumentCreated(
  "crypto-ogs/{ogId}",
  async (event) => {
    try {
      const snap = event.data!;
      const ogData = snap.data() as ContentDoc;

      if (!(await claimNotification(snap.ref, ogData))) {
        return;
      }

      const slug = ogData?.slug || event.params.ogId;

      await sendPushNotification(
        "New Crypto OG on CryptoWiki",
        ogData?.title || "New Crypto OG",
        {
          type: "og",
          slug,
          url: `${SITE_URL}/crypto-ogs/${slug}`,
        }
      );
    } catch (error) {
      console.error("Error in sendNewOGNotification:", error);
    }
  }
);

// Videos are not MDX like the sections above - they come from json/videos.json
// in the site repo, which the content index reads into the "videos" collection.
// Only long form reaches it, because only long form has a page at
// /videos/<slug> for the notification to open.
export const sendNewVideoNotification = onDocumentCreated(
  "videos/{videoId}",
  async (event) => {
    try {
      const snap = event.data!;
      const videoData = snap.data() as ContentDoc;

      if (!(await claimNotification(snap.ref, videoData))) {
        return;
      }

      const slug = videoData?.slug || event.params.videoId;

      await sendPushNotification(
        "New video on CryptoWiki",
        videoData?.title || "New video",
        {
          type: "video",
          slug,
          url: `${SITE_URL}/videos/${slug}`,
        }
      );
    } catch (error) {
      console.error("Error in sendNewVideoNotification:", error);
    }
  }
);

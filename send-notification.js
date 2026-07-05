import admin from "../lib/firebase.js";
import { db } from "../lib/firebase.js";

export default async function handler(req, res) {
  try {
    const snapshot = await db.collection("users_tokens").get();

    const tokens = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.token) tokens.push(data.token);
    });

    if (tokens.length === 0) {
      return res.status(200).json({
        success: false,
        message: "No tokens found"
      });
    }

    const messageBase = {
      notification: {
        title: "🕌 الرحمن",
        body: "هذا إشعار تجريبي"
      },
      android: {
        priority: "high",
        notification: {
          sound: "default"
        }
      },
      webpush: {
        notification: {
          icon: "https://res.cloudinary.com/db9h7zm1h/image/upload/w_500,q_auto,f_auto/v1774918203/hi5hebyjkpi3gkdgrdef.jpg",
          badge: "https://res.cloudinary.com/db9h7zm1h/image/upload/w_500,q_auto,f_auto/v1774918203/hi5hebyjkpi3gkdgrdef.jpg"
        },
        headers: {
          Urgency: "high"
        }
      }
    };

    let successCount = 0;
    let failureCount = 0;
    const chunkSize = 500;

    for (let i = 0; i < tokens.length; i += chunkSize) {
      const tokensChunk = tokens.slice(i, i + chunkSize);
      const message = { ...messageBase, tokens: tokensChunk };

      const response = await admin.messaging().sendEachForMulticast(message);
      successCount += response.successCount;
      failureCount += response.failureCount;

      if (response.failureCount > 0) {
        const failedTokensToRemove = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errCode = resp.error?.code;
            if (
              errCode === "messaging/invalid-registration-token" ||
              errCode === "messaging/registration-token-not-registered"
            ) {
              failedTokensToRemove.push(tokensChunk[idx]);
            }
          }
        });

        if (failedTokensToRemove.length > 0) {
          const batch = db.batch();
          failedTokensToRemove.forEach((badToken) => {
            const docRef = db.collection("users_tokens").doc(badToken);
            batch.delete(docRef);
          });
          await batch.commit().catch(e => console.error("Error deleting bad tokens", e));
        }
      }
    }

    return res.status(200).json({
      success: true,
      sent: successCount,
      failed: failureCount
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
import admin from "../lib/firebase.js";
import { db } from "../lib/firebase.js";

import {
  getPrayerSchedule,
  getMinutesNow,
  timeToMinutes,
  getSwedenDate
} from "../lib/prayer-times.js";

const BEFORE_ADHAN = 15;

async function getTokens() {
  const snapshot = await db.collection("users_tokens").get();

  const tokens = [];

  snapshot.forEach((doc) => {
    const data = doc.data();

    if (data.token) {
      tokens.push(data.token);
    }
  });

  return tokens;
}

async function sendNotification(title, body) {
  const tokens = await getTokens();

  if (!tokens.length) {
    return {
      success: false,
      message: "No tokens"
    };
  }

  const messageBase = {
    notification: {
      title,
      body
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

  return {
    success: successCount > 0,
    sent: successCount,
    failed: failureCount
  };
}

function todayKey() {
  const d = getSwedenDate();

  return (
    d.getFullYear() +
    "-" +
    (d.getMonth() + 1) +
    "-" +
    d.getDate()
  );
}

async function alreadySent(id) {
  const doc = await db
    .collection("notification_logs")
    .doc(id)
    .get();

  return doc.exists;
}

async function markSent(id) {
  await db
    .collection("notification_logs")
    .doc(id)
    .set({
      sent: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
}

async function sendHourlyReminder(nowMinutes) {

  const id = `${todayKey()}-hour-${Math.floor(nowMinutes / 60)}`;

  const minute = nowMinutes % 60;

  if (minute >= 5) return null;

  if (await alreadySent(id)) return null;

  const result = await sendNotification(
    "🤍 صلِّ على النبي ﷺ",
    "اللهم صلِّ وسلم وبارك على سيدنا محمد ﷺ"
  );

  if (result.success) {
    await markSent(id);
  }

  return result;
}

async function sendPrayerNotifications(nowMinutes) {
  let notificationSent = false;

  const prayers = getPrayerSchedule();

  for (const prayer of prayers) {

    const prayerMinutes = timeToMinutes(prayer.time);

    const beforeId =
      `${todayKey()}-${prayer.id}-before`;

    if (
      nowMinutes >= prayerMinutes - BEFORE_ADHAN &&
      nowMinutes < prayerMinutes
    ) {

      if (!(await alreadySent(beforeId))) {

        const result = await sendNotification(
          `🕌 اقترب أذان ${prayer.name}`,
          `باقي ${BEFORE_ADHAN} دقيقة على أذان ${prayer.name}`
        );

        if (result.success) {
          await markSent(beforeId);
          notificationSent = true;
        }
      }
    }

    const adhanId =
      `${todayKey()}-${prayer.id}-adhan`;

    if (
      nowMinutes >= prayerMinutes &&
      nowMinutes < prayerMinutes + 5
    ) {

      if (!(await alreadySent(adhanId))) {

        const result = await sendNotification(
          `🕌 أذان ${prayer.name}`,
          `حان الآن موعد أذان ${prayer.name}`
        );

        if (result.success) {
          await markSent(adhanId);
          notificationSent = true;
        }
      }
    }

    // حساب وقت الإقامة
    let iqamaOffset = 0;
    if (prayer.id === "fajr") {
      iqamaOffset = 20;
    } else if (["dhuhr", "asr", "maghrib", "isha"].includes(prayer.id)) {
      iqamaOffset = 10;
    }

    if (iqamaOffset > 0) {
      const iqamaMinutes = (prayerMinutes + iqamaOffset) % (24 * 60);

      const beforeIqamaId = `${todayKey()}-${prayer.id}-before-iqama`;

      if (
        nowMinutes >= iqamaMinutes - 5 &&
        nowMinutes < iqamaMinutes
      ) {
        if (!(await alreadySent(beforeIqamaId))) {
          const result = await sendNotification(
            `⏳ اقتربت إقامة صلاة ${prayer.name}`,
            `باقي 5 دقائق على إقامة صلاة ${prayer.name}`
          );

          if (result.success) {
            await markSent(beforeIqamaId);
            notificationSent = true;
          }
        }
      }

      const iqamaId = `${todayKey()}-${prayer.id}-iqama`;

      if (
        nowMinutes >= iqamaMinutes &&
        nowMinutes < iqamaMinutes + 5
      ) {
        if (!(await alreadySent(iqamaId))) {
          const result = await sendNotification(
            `🕌 إقامة صلاة ${prayer.name}`,
            `حان الآن موعد إقامة صلاة ${prayer.name}`
          );

          if (result.success) {
            await markSent(iqamaId);
            notificationSent = true;
          }
        }
      }
    }
  }

  return notificationSent;
}

export default async function handler(req, res) {
  try {

    const nowMinutes = getMinutesNow();

    const prayerResult = await sendPrayerNotifications(nowMinutes);

    const hourlyResult = await sendHourlyReminder(nowMinutes);

    return res.status(200).json({
      success: true,
      swedenTime: getSwedenDate().toLocaleString("sv-SE", {
        timeZone: "Europe/Stockholm"
      }),
      nowMinutes,
      prayerNotification: prayerResult || "none",
      hourlyNotification: hourlyResult || "none"
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      error: error.message
    });

  }
}
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

let app;

if (!admin.apps.length) {
  let serviceAccount;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // استخدام مسار آمن لتجنب أخطاء Vercel عند التشغيل المحلي
    const filePath = path.resolve(process.cwd(), "al-rahman-d0529-firebase-adminsdk-fbsvc-7923d4d58c.json");
    serviceAccount = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  app = admin.app();
}

const db = admin.firestore();

export default admin;
export { db };
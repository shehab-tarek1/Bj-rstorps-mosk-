importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyDLOQ3i-cyhZV-A1oN5Jhy_OQj_KdqClzk",
  authDomain: "al-rahman-d0529.firebaseapp.com",
  projectId: "al-rahman-d0529",
  storageBucket: "al-rahman-d0529.firebasestorage.app",
  messagingSenderId: "1081097400036",
  appId: "1:1081097400036:web:a5b9ada478c9bdb7ae06f1"
});

const messaging = firebase.messaging();

// 1. الطريقة الرسمية من فايربيز
messaging.setBackgroundMessageHandler(function(payload) {
  const notificationTitle = payload.notification?.title || 'مسجد الرحمن';
  const notificationOptions = {
    body: payload.notification?.body || 'لديك إشعار جديد',
    icon: 'https://res.cloudinary.com/db9h7zm1h/image/upload/w_500,q_auto,f_auto/v1774918203/hi5hebyjkpi3gkdgrdef.jpg',
    badge: 'https://res.cloudinary.com/db9h7zm1h/image/upload/w_500,q_auto,f_auto/v1774918203/hi5hebyjkpi3gkdgrdef.jpg',
    vibrate: [200, 100, 200, 100, 200],
    data: { url: 'https://perstorp-moske.netlify.app/' },
    requireInteraction: true // إجبار الإشعار على البقاء على الشاشة حتى يضغط عليه المستخدم
  };
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 2. التقاط جذري (Fallback) في حال كان المتصفح نائماً تماماً وتجاهل فايربيز
self.addEventListener('push', function(event) {
  // إذا لم يوقظ فايربيز المتصفح، هذه الدالة ستوقظه بقوة النظام
  if (event.data) {
    const payload = event.data.json();
    if (!payload.notification) { // لتجنب تكرار الإشعار
      const title = payload.data?.title || 'مسجد الرحمن';
      const options = {
        body: payload.data?.body || 'لديك إشعار جديد',
        icon: 'https://res.cloudinary.com/db9h7zm1h/image/upload/w_500,q_auto,f_auto/v1774918203/hi5hebyjkpi3gkdgrdef.jpg',
        badge: 'https://res.cloudinary.com/db9h7zm1h/image/upload/w_500,q_auto,f_auto/v1774918203/hi5hebyjkpi3gkdgrdef.jpg',
        vibrate: [200, 100, 200],
        requireInteraction: true
      };
      event.waitUntil(self.registration.showNotification(title, options));
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('https://perstorp-moske.netlify.app/');
      }
    })
  );
});

// 3. نظام الكاش (Offline Mode) للحفاظ على التطبيق حياً
const CACHE_NAME = 'arrahman-v2.0';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/prayers.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.includes('firestore') || event.request.url.includes('google')) {
      return;
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
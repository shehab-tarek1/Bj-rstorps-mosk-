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

// معالجة الإشعارات في الخلفية بكفاءة عالية
messaging.setBackgroundMessageHandler(function(payload) {
  const notificationTitle = payload.notification?.title || payload.data?.title || 'مسجد الرحمن';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'لديك إشعار جديد',
    icon: 'https://res.cloudinary.com/db9h7zm1h/image/upload/w_500,q_auto,f_auto/v1774918203/hi5hebyjkpi3gkdgrdef.jpg',
    badge: 'https://res.cloudinary.com/db9h7zm1h/image/upload/w_500,q_auto,f_auto/v1774918203/hi5hebyjkpi3gkdgrdef.jpg',
    vibrate: [200, 100, 200, 100, 200],
    data: { url: '/' } // مسار فتح الموقع
  };
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// الحدث الأهم: فتح الموقع تلقائياً عند قيام المستخدم بالضغط على الإشعار من شريط الإشعارات
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      // إذا كان الموقع مفتوحاً بالفعل في الخلفية، قم بالتركيز عليه
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // إذا كان مغلقاً تماماً، قم بفتحه
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

const CACHE_NAME = 'arrahman-v1.1'; // تم تحديث رقم النسخة لإجبار المتصفحات على التحديث
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/prayers.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;800&display=swap'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // استثناء طلبات قاعدة البيانات والصور من الكاش لمنع اللاج وتثقيل الموقع
  if (event.request.url.includes('firestore') || 
      event.request.url.includes('google') || 
      event.request.url.includes('cloudinary')) {
      return;
  }
  event.respondWith(caches.match(event.request).then(res => res || fetch(event.request)));
});
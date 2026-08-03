importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyABs3wrlSNflZuKylrxQoV46hr6066bsmg",
  authDomain: "ck-notes-c128c.firebaseapp.com",
  databaseURL: "https://ck-notes-c128c-default-rtdb.firebaseio.com",
  projectId: "ck-notes-c128c",
  storageBucket: "ck-notes-c128c.firebasestorage.app",
  messagingSenderId: "252900430072",
  appId: "1:252900430072:web:300d993cf8aa3944abab0d"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "New Notification";
  const options = {
    body: payload?.notification?.body || "",
    icon: "/icons/icon-192x192.png",
  };

  self.registration.showNotification(title, options);
});
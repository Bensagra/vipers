importScripts("https://www.gstatic.com/firebasejs/12.11.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging-compat.js");

const searchParams = new URL(self.location.href).searchParams;

const firebaseConfig = {
  apiKey: searchParams.get("apiKey") || "",
  authDomain: searchParams.get("authDomain") || "",
  projectId: searchParams.get("projectId") || "",
  messagingSenderId: searchParams.get("messagingSenderId") || "",
  appId: searchParams.get("appId") || "",
};

if (
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId
) {
  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || "Pedido actualizado";
    const body = payload.notification?.body || "Tu pedido tuvo un cambio";

    self.registration.showNotification(title, {
      body,
      icon: "/next.svg",
      badge: "/next.svg",
      data: payload.data || {},
    });
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const target = "/my-orders";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientsArr) => {
        const client = clientsArr.find((item) => item.url.includes(target));
        if (client) {
          return client.focus();
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(target);
        }

        return undefined;
      }),
  );
});

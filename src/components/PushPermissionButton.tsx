"use client";

import { useMemo, useState } from "react";

import { initializeApp, type FirebaseApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

let firebaseApp: FirebaseApp | null = null;

type FirebasePublicConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  messagingSenderId: string;
  appId: string;
  vapidKey: string;
};

function getFirebasePublicConfig(): FirebasePublicConfig {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "",
  };
}

function hasConfig(config: FirebasePublicConfig) {
  return Boolean(
    config.apiKey &&
      config.authDomain &&
      config.projectId &&
      config.messagingSenderId &&
      config.appId &&
      config.vapidKey,
  );
}

function getOrCreateApp(config: FirebasePublicConfig) {
  if (!firebaseApp) {
    firebaseApp = initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
    });
  }

  return firebaseApp;
}

export function PushPermissionButton() {
  const [statusText, setStatusText] = useState("");
  const [loading, setLoading] = useState(false);

  const config = useMemo(() => getFirebasePublicConfig(), []);
  const configured = useMemo(() => hasConfig(config), [config]);

  async function enablePush() {
    if (!configured) {
      setStatusText("Faltan variables NEXT_PUBLIC_FIREBASE_* para activar push.");
      return;
    }

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatusText("Este navegador no soporta notificaciones push.");
      return;
    }

    setLoading(true);
    setStatusText("");

    try {
      const messagingSupported = await isSupported().catch(() => false);
      if (!messagingSupported) {
        setStatusText("Firebase messaging no esta soportado en este navegador.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatusText("Permiso de notificaciones denegado.");
        return;
      }

      const swParams = new URLSearchParams({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
      });

      const registration = await navigator.serviceWorker.register(
        `/firebase-messaging-sw.js?${swParams.toString()}`,
      );

      const app = getOrCreateApp(config);
      const messaging = getMessaging(app);
      const fcmToken = await getToken(messaging, {
        vapidKey: config.vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!fcmToken) {
        setStatusText("No se pudo obtener token push.");
        return;
      }

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fcmToken }),
      });

      if (!response.ok) {
        setStatusText("No se pudo registrar el token en el servidor.");
        return;
      }

      setStatusText("Notificaciones push activadas en este dispositivo.");
    } catch {
      setStatusText("Error al activar notificaciones push.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-panel p-4">
      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-title text-lg">Push web</h3>
          <span className="chip-mint">opcional</span>
        </div>

        <button className="btn-primary" type="button" onClick={enablePush} disabled={loading}>
          {loading ? "Activando..." : "Activar"}
        </button>

        {statusText ? <p className="text-sm subtle-text">{statusText}</p> : null}
      </div>
    </div>
  );
}

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging, type Messaging, type Message } from "firebase-admin/messaging";

let messaging: Messaging | null = null;
let firebaseInitError: string | null = null;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (projectId && clientEmail && privateKey) {
  try {
    const app =
      getApps()[0] ??
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });

    messaging = getMessaging(app);
  } catch (error) {
    firebaseInitError = error instanceof Error ? error.message : "Firebase init error";
    messaging = null;
  }
}

export function hasFirebaseAdminConfigured() {
  return messaging !== null;
}

export function getFirebaseAdminInitError() {
  return firebaseInitError;
}

export async function sendPushMessage(message: Message) {
  if (!messaging) {
    return {
      ok: false as const,
      error: firebaseInitError ?? "Firebase admin no configurado",
    };
  }

  try {
    const id = await messaging.send(message);
    return { ok: true as const, id };
  } catch (error) {
    const text = error instanceof Error ? error.message : "Error enviando push";
    return { ok: false as const, error: text };
  }
}

// Firebase initialization for auth (client-side)
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const messagingPromise = (async () => {
  try {
    const supported = await isSupported();
    if (!supported) return null;
    return getMessaging(app);
  } catch {
    return null;
  }
})();

export async function registerPushToken(vapidKey) {
  const messaging = await messagingPromise;
  if (!messaging) return null;
  try {
    const token = await getToken(messaging, { vapidKey });
    return token || null;
  } catch (e) {
    console.error('FCM getToken error', e);
    return null;
  }
}

export function onForegroundMessage(handler) {
  messagingPromise.then((messaging) => {
    if (messaging) onMessage(messaging, handler);
  });
}
export default app;

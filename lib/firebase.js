import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

// Baked in on purpose: a Firebase web config is public by design, and hardcoding
// it means the app deploys to Vercel with zero environment setup. Access is
// controlled by the rules in firestore.rules, not by hiding these values.
// Environment variables still win if you ever point this at another project.
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDAwijQeAdYX--x1-SBd914W53JtoP9uiU',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'ezm-app-5de94.firebaseapp.com',
  databaseURL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    'https://ezm-app-5de94-default-rtdb.firebaseio.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ezm-app-5de94',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ezm-app-5de94.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '79157879230',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:79157879230:web:f1139f71d7d626ce7799ef',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Offline-first: Firestore keeps a full local copy in IndexedDB. Reads are served
// from it with no network, and writes are queued and replayed automatically once
// the connection returns — no manual sync step.
function createDb() {
  if (typeof window === 'undefined') return getFirestore(app);
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    // Already initialised (fast refresh / second import) — reuse the instance.
    return getFirestore(app);
  }
}

export const db = createDb();

export default app;

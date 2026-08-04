import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

/*
 * Server-only. This file must never be imported by anything under pages/**
 * except pages/api/** — the private key it reads gives full control over the
 * Firebase project (create/delete any user, bypass Firestore rules) and must
 * never reach the browser bundle.
 */

// Matches the projectId baked into lib/firebase.js. It isn't a secret — the
// Firebase project id is public by design — so it's fine as a plain fallback
// rather than one more environment variable to configure.
const DEFAULT_PROJECT_ID = 'ezm-app-5de94';

function adminApp() {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || DEFAULT_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // Vercel env vars store literal "\n" for newlines inside a multi-line secret.
  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('FIREBASE_ADMIN_* environment variables are not configured');
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export const adminAuth = () => getAuth(adminApp());

export const isAdminConfigured = () =>
  Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY);

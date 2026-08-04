import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';
import { auth } from './firebase';

export const AUTH_DOMAIN = 'dieselapp.com';
export const MANAGER_EMAIL = `manager@${AUTH_DOMAIN}`;

/**
 * Accounts are created by hand in the Firebase console and the role is read
 * straight back out of the email — no user table, no extra round trip, and the
 * role is known the instant auth restores (so it works with no signal).
 *
 * Both naming styles are accepted, because either is a reasonable thing to type
 * into the Firebase console:
 *
 *   driver-driver1@dieselapp.com  -> driver      driver1@dieselapp.com   -> driver
 *   mechanic-ali@dieselapp.com    -> mechanic    mechanic1@dieselapp.com -> mechanic
 *   manager@dieselapp.com         -> manager
 *
 * What matters is that the address *starts with* the role word.
 */
export function roleFromEmail(email) {
  const local = String(email ?? '')
    .toLowerCase()
    .split('@')[0];
  if (local.startsWith('manager')) return 'manager';
  if (local.startsWith('mechanic')) return 'mechanic';
  if (local.startsWith('driver')) return 'driver';
  return null;
}

/** driver-driver1@dieselapp.com -> driver1 ; driver1@dieselapp.com -> driver1 */
export function employeeIdFromEmail(email) {
  const local = String(email ?? '').split('@')[0];
  return local.replace(/^(driver|mechanic|manager)-/i, '') || local;
}

/**
 * The crew types an employee ID, not an email. `manager` is its own account;
 * for everyone else we try the plain form first and then each role prefix,
 * keeping whichever one authenticates. Typing a full email also works, as an
 * escape hatch.
 */
export function candidateEmails(employeeId) {
  const id = String(employeeId).trim().toLowerCase();
  if (id.includes('@')) return [id];
  if (id === 'manager') return [MANAGER_EMAIL];
  return [
    `${id}@${AUTH_DOMAIN}`,
    `driver-${id}@${AUTH_DOMAIN}`,
    `mechanic-${id}@${AUTH_DOMAIN}`,
  ];
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, (fbUser) => {
        setUser(fbUser);
        setLoading(false);
      }),
    []
  );

  const profile = useMemo(() => {
    if (!user) return null;
    return {
      uid: user.uid,
      email: user.email,
      role: roleFromEmail(user.email),
      employeeId: employeeIdFromEmail(user.email),
      name: employeeIdFromEmail(user.email),
    };
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      role: profile?.role ?? null,
      async login(employeeId, secret) {
        const password = String(secret).trim();
        let lastError = null;
        for (const email of candidateEmails(employeeId)) {
          try {
            return await signInWithEmailAndPassword(auth, email, password);
          } catch (err) {
            lastError = err;
            // Network problems will not be fixed by trying the other prefix.
            if (err?.code === 'auth/network-request-failed') throw err;
          }
        }
        throw lastError;
      },
      logout: () => fbSignOut(auth),
    }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export const homeForRole = (role) =>
  role === 'manager' ? '/manager' : role === 'mechanic' ? '/mechanic' : '/driver';

/**
 * Redirects to the login page when signed out, or to the caller's own home when
 * they open a page meant for a different role.
 */
export function useRequireRole(allowedRoles) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/');
      return;
    }
    if (profile && !allowed.includes(profile.role)) {
      router.replace(homeForRole(profile.role));
    }
  }, [loading, user, profile, router, allowedRoles]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ready: !loading && !!user && !!profile && allowed.includes(profile.role),
    profile,
    loading,
  };
}

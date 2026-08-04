import { auth } from './firebase';

async function authedFetch(path, options = {}) {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token ?? ''}`,
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `request failed (${res.status})`);
  }
  return body;
}

export const fetchStaffUsers = () => authedFetch('/api/admin/users').then((d) => d.users);

export const setStaffPassword = (uid, newPassword) =>
  authedFetch('/api/admin/set-password', {
    method: 'POST',
    body: JSON.stringify({ uid, newPassword }),
  });

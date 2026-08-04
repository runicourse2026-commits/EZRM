import { adminAuth, isAdminConfigured } from './firebaseAdmin';
import { MANAGER_EMAIL } from './auth';

/**
 * Every admin API route needs the same check: a valid Firebase ID token
 * belonging to the one manager account. Returns the decoded token on success,
 * or writes an error response to `res` and returns null.
 */
export async function requireManager(req, res) {
  if (!isAdminConfigured()) {
    res.status(503).json({ error: 'admin-not-configured' });
    return null;
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'unauthorized' });
    return null;
  }

  try {
    const decoded = await adminAuth().verifyIdToken(token);
    if (decoded.email !== MANAGER_EMAIL) {
      res.status(403).json({ error: 'forbidden' });
      return null;
    }
    return decoded;
  } catch (err) {
    console.error('[EZRM] token verification failed', err);
    res.status(401).json({ error: 'unauthorized' });
    return null;
  }
}

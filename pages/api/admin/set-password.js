import { adminAuth } from '@/lib/firebaseAdmin';
import { requireManager } from '@/lib/adminAuthorize';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method-not-allowed' });
    return;
  }

  if (!(await requireManager(req, res))) return;

  const { uid, newPassword } = req.body || {};
  if (!uid || typeof newPassword !== 'string' || newPassword.length < 6) {
    res.status(400).json({ error: 'invalid-input' });
    return;
  }

  try {
    await adminAuth().updateUser(uid, { password: newPassword });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[EZRM] set password failed', err);
    res.status(500).json({ error: 'failed' });
  }
}

import { adminAuth } from '@/lib/firebaseAdmin';
import { requireManager } from '@/lib/adminAuthorize';
import { employeeIdFromEmail, roleFromEmail } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method-not-allowed' });
    return;
  }

  if (!(await requireManager(req, res))) return;

  try {
    const users = [];
    let pageToken;
    do {
      // 1000 is the max page size the Admin SDK allows per call.
      const page = await adminAuth().listUsers(1000, pageToken);
      users.push(...page.users);
      pageToken = page.pageToken;
    } while (pageToken);

    const staff = users
      .map((u) => ({
        uid: u.uid,
        email: u.email ?? '',
        role: roleFromEmail(u.email),
        employeeId: employeeIdFromEmail(u.email),
      }))
      .filter((u) => u.role === 'driver' || u.role === 'mechanic')
      .sort((a, b) => a.employeeId.localeCompare(b.employeeId));

    res.status(200).json({ users: staff });
  } catch (err) {
    console.error('[EZRM] list users failed', err);
    res.status(500).json({ error: 'failed' });
  }
}

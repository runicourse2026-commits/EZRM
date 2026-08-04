/*
 * TEMPORARY diagnostic endpoint — delete this file once the Firebase Admin
 * env var issue is resolved. Reports only presence/shape, never the actual
 * secret values, so it's safe to hit directly in a browser while debugging.
 */
export default function handler(req, res) {
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '';
  const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY || '';

  res.status(200).json({
    hasClientEmail: Boolean(clientEmail),
    clientEmailLength: clientEmail.length,
    clientEmailLooksRight: clientEmail.includes('@') && clientEmail.includes('.iam.gserviceaccount.com'),
    hasPrivateKey: Boolean(privateKeyRaw),
    privateKeyLength: privateKeyRaw.length,
    privateKeyStartsRight: privateKeyRaw.startsWith('-----BEGIN PRIVATE KEY-----'),
    privateKeyEndsRight: privateKeyRaw.trim().endsWith('-----END PRIVATE KEY-----') ||
      privateKeyRaw.endsWith('-----END PRIVATE KEY-----\n'),
    privateKeyHasEscapedNewlines: privateKeyRaw.includes('\\n'),
    privateKeyHasRealNewlines: privateKeyRaw.includes('\n'),
  });
}

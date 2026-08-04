import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Firestore applies a write to the local cache synchronously, but the promise
 * returned by addDoc() does not settle until the server acknowledges it — so
 * awaiting it on a truck with no signal would hang the form forever.
 *
 * Instead we let the local write stand on its own and only wait on the server
 * round-trip when the device believes it is online (and even then, not for
 * long). Genuine failures still surface.
 */
const SERVER_ACK_TIMEOUT_MS = 6000;

export function useSaveLog() {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // 'online' | 'offline' | null
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState([]); // what this session has recorded
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const save = useCallback(async (write, entry, onDone) => {
    setSaving(true);
    setError(null);
    setStatus(null);

    const wasOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
    const promise = write();
    // Keep a no-op catch attached so a later rejection is never "unhandled".
    promise.catch(() => {});

    let acknowledged = false;
    try {
      if (wasOnline) {
        acknowledged = await Promise.race([
          promise.then(() => true),
          new Promise((resolve) => setTimeout(() => resolve(false), SERVER_ACK_TIMEOUT_MS)),
        ]);
      }
      setStatus(acknowledged ? 'online' : 'offline');
      if (entry) {
        setSaved((current) => [
          {
            key: `${Date.now()}-${current.length}`,
            at: new Date(),
            truckNumber: entry.truck?.number ?? '',
            ...entry.data,
          },
          ...current,
        ]);
      }
      onDone?.();
    } catch (err) {
      console.error('[EZRM] save failed', err);
      setError(err);
    } finally {
      setSaving(false);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setStatus(null), 6000);
    }
  }, []);

  return { save, saving, status, error, saved };
}

import { useEffect, useState } from 'react';
import { useAuth } from './auth';
import { fetchStaffNames } from './db';

/**
 * The signed-in person's real name (set by the manager), falling back to the
 * short login id until one is set. Reads the cached names map, so this costs
 * at most one document read per session.
 */
export function useDisplayName() {
  const { profile } = useAuth();
  const [name, setName] = useState(profile?.name ?? '');

  useEffect(() => {
    if (!profile) return undefined;
    setName(profile.name);
    let cancelled = false;
    fetchStaffNames()
      .then((names) => {
        if (!cancelled && names[profile.uid]) setName(names[profile.uid]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [profile]);

  return name;
}

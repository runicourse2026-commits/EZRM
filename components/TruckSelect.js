import { useEffect, useMemo, useState } from 'react';
import { Select } from './Fields';
import { useLang } from '@/lib/i18n';
import { fetchTrucks, getLastTruckId, setLastTruckId } from '@/lib/db';

/**
 * Loads the truck list once and pre-selects whichever truck this user picked
 * last time — drivers stay on the same vehicle for weeks, so re-choosing it on
 * every form is pure friction. They can still change it freely.
 */
export function useTruckPicker(uid) {
  const [trucks, setTrucks] = useState([]);
  const [truckId, setTruckId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchTrucks()
      .then((list) => {
        if (cancelled) return;
        setTrucks(list);
        const remembered = getLastTruckId(uid);
        const exists = list.some((truck) => truck.id === remembered);
        if (list.length) setTruckId(exists ? remembered : list[0].id);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[EZRM] could not load trucks', err);
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const truck = useMemo(() => trucks.find((tr) => tr.id === truckId) ?? null, [trucks, truckId]);

  return {
    trucks,
    truckId,
    setTruckId,
    truck,
    loading,
    remember: () => setLastTruckId(uid, truckId),
  };
}

export default function TruckSelect({ picker, error }) {
  const { t } = useLang();
  const { trucks, truckId, setTruckId, loading } = picker;

  return (
    <Select
      label={t('truck')}
      value={truckId}
      error={error}
      onChange={(e) => setTruckId(e.target.value)}
      disabled={loading || !trucks.length}
    >
      {loading && <option value="">{t('loading')}</option>}
      {!loading && !trucks.length && <option value="">{t('noTrucks')}</option>}
      {!loading &&
        trucks.map((truck) => (
          <option key={truck.id} value={truck.id}>
            {truck.plate ? `${truck.number} — ${truck.plate}` : truck.number}
          </option>
        ))}
    </Select>
  );
}

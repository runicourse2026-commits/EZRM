import { useEffect, useMemo, useState } from 'react';
import { Select } from './Fields';
import { useLang } from '@/lib/i18n';
import { fetchDriverTruckIds, fetchTrucks, getLastTruckId, setLastTruckId } from '@/lib/db';

/**
 * Loads the truck list once and pre-selects whichever truck this user picked
 * last time — drivers stay on the same vehicle for weeks, so re-choosing it on
 * every form is pure friction. They can still change it freely.
 *
 * With `restrict: true`, the list is narrowed to whatever the manager assigned
 * this uid in the `driverTrucks` collection. A driver with no assignment yet
 * (or an empty one) still sees every truck — nothing breaks before the manager
 * gets around to assigning anyone.
 */
export function useTruckPicker(uid, { restrict = false } = {}) {
  const [trucks, setTrucks] = useState([]);
  const [truckId, setTruckId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchTrucks(), restrict ? fetchDriverTruckIds(uid) : Promise.resolve([])])
      .then(([allTrucks, assignedIds]) => {
        if (cancelled) return;
        const list = assignedIds.length
          ? allTrucks.filter((truck) => assignedIds.includes(truck.id))
          : allTrucks;
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
  }, [uid, restrict]);

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

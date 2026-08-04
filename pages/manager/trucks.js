import { useEffect, useState } from 'react';
import Layout, { FullPageSpinner } from '@/components/Layout';
import { TextInput } from '@/components/Fields';
import { useLang } from '@/lib/i18n';
import { useRequireRole } from '@/lib/auth';
import { addTruck, deleteTruck, fetchTrucks } from '@/lib/db';

export default function TrucksPage() {
  const { t } = useLang();
  const { ready } = useRequireRole('manager');

  const [trucks, setTrucks] = useState([]);
  const [number, setNumber] = useState('');
  const [plate, setPlate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrucks().then(setTrucks).catch(console.error);
  }, []);

  if (!ready) return <FullPageSpinner />;

  const onAdd = async (e) => {
    e.preventDefault();
    setError(null);
    const id = number.trim();
    if (!id) {
      setError(t('required'));
      return;
    }
    if (trucks.some((truck) => truck.id === id)) {
      setError(t('truckExists'));
      return;
    }
    setBusy(true);
    try {
      await addTruck({ number: id, plate });
      // Update in place rather than re-reading the collection.
      setTrucks((current) =>
        [...current, { id, number: id, plate: plate.trim() }].sort((a, b) =>
          a.number.localeCompare(b.number)
        )
      );
      setNumber('');
      setPlate('');
    } catch (err) {
      console.error('[EZRM] add truck failed', err);
      setError(t('genericError'));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (truck) => {
    if (!window.confirm(`${t('confirmDeleteTruck')}\n${truck.number}`)) return;
    try {
      await deleteTruck(truck.id);
      setTrucks((current) => current.filter((item) => item.id !== truck.id));
    } catch (err) {
      console.error('[EZRM] delete truck failed', err);
      setError(t('genericError'));
    }
  };

  return (
    <Layout title={t('trucks')} back="/manager">
      <form className="card" onSubmit={onAdd} noValidate>
        <h2>{t('addTruck')}</h2>
        <TextInput
          label={t('truckNumber')}
          value={number}
          onChange={(e) => setNumber(e.target.value)}
        />
        <TextInput
          label={`${t('truckPlate')} (${t('optional')})`}
          value={plate}
          onChange={(e) => setPlate(e.target.value)}
        />
        {error && <div className="banner error">{error}</div>}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? t('saving') : t('addTruck')}
        </button>
      </form>

      <div className="card">
        <h2>
          {t('trucks')} ({trucks.length})
        </h2>
        {!trucks.length ? (
          <p className="muted" style={{ margin: 0 }}>
            {t('noEntries')}
          </p>
        ) : (
          <ul className="list">
            {trucks.map((truck) => (
              <li key={truck.id}>
                <div className="grow">
                  <div className="title">{truck.number}</div>
                  {truck.plate && <div className="meta">{truck.plate}</div>}
                </div>
                <button type="button" className="btn danger small" onClick={() => onDelete(truck)}>
                  {t('deleteTruck')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}

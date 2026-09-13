import { useEffect, useState } from 'react';
import Layout, { FullPageSpinner } from '@/components/Layout';
import { TextInput } from '@/components/Fields';
import { useLang } from '@/lib/i18n';
import { useRequireRole } from '@/lib/auth';
import { addPlace, deletePlace, fetchPlaces } from '@/lib/db';

/**
 * The manager's list of trip origins/destinations. Drivers pick from these in
 * the trip form instead of typing, which keeps one spelling per place in the
 * exports.
 */
export default function PlacesPage() {
  const { t } = useLang();
  const { ready } = useRequireRole('manager');

  const [places, setPlaces] = useState([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlaces().then(setPlaces).catch(console.error);
  }, []);

  if (!ready) return <FullPageSpinner />;

  const onAdd = async (e) => {
    e.preventDefault();
    setError(null);
    const id = name.trim();
    if (!id) {
      setError(t('required'));
      return;
    }
    if (places.some((place) => place.id === id)) {
      setError(t('placeExists'));
      return;
    }
    setBusy(true);
    try {
      await addPlace(id);
      setPlaces((current) =>
        [...current, { id, name: id }].sort((a, b) => a.name.localeCompare(b.name))
      );
      setName('');
    } catch (err) {
      console.error('[EZRM] add place failed', err);
      setError(t('genericError'));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (place) => {
    if (!window.confirm(`${t('confirmDeletePlace')}\n${place.name}`)) return;
    try {
      await deletePlace(place.id);
      setPlaces((current) => current.filter((item) => item.id !== place.id));
    } catch (err) {
      console.error('[EZRM] delete place failed', err);
      setError(t('genericError'));
    }
  };

  return (
    <Layout title={t('places')} subtitle={t('managePlaces')} back="/manager">
      <form className="card" onSubmit={onAdd} noValidate>
        <h2>{t('addPlace')}</h2>
        <TextInput label={t('placeName')} value={name} onChange={(e) => setName(e.target.value)} />
        {error && <div className="banner error">{error}</div>}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? t('saving') : t('addPlace')}
        </button>
      </form>

      <div className="card">
        <h2>
          {t('places')} ({places.length})
        </h2>
        {!places.length ? (
          <p className="muted" style={{ margin: 0 }}>
            {t('noEntries')}
          </p>
        ) : (
          <ul className="list">
            {places.map((place) => (
              <li key={place.id}>
                <div className="grow">
                  <div className="title">{place.name}</div>
                </div>
                <button type="button" className="btn danger small" onClick={() => onDelete(place)}>
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

import { useEffect, useState } from 'react';
import Layout, { FullPageSpinner } from '@/components/Layout';
import { NumberInput, Select, TextInput } from '@/components/Fields';
import TruckSelect, { useTruckPicker } from '@/components/TruckSelect';
import RecentEntries from '@/components/RecentEntries';
import SaveStatus from '@/components/SaveStatus';
import { useLang } from '@/lib/i18n';
import { useAuth, useRequireRole } from '@/lib/auth';
import { addLog, fetchPlaces } from '@/lib/db';
import { useSaveLog } from '@/lib/useSaveLog';
import { numberOrText, validateRequired } from '@/lib/validate';

const OTHER = '__other__';

/**
 * Origin/destination come from the manager's places list — tapping beats
 * typing for this crew, and the exports get one spelling per place. "Other"
 * falls back to free text, and if no places are defined yet the fields are
 * plain text like before.
 */
function PlaceField({ label, places, choice, setChoice, text, setText, error }) {
  const { t } = useLang();

  if (!places.length) {
    return (
      <TextInput label={label} value={text} error={error} onChange={(e) => setText(e.target.value)} />
    );
  }

  return (
    <>
      <Select label={label} value={choice} error={error} onChange={(e) => setChoice(e.target.value)}>
        <option value="">—</option>
        {places.map((place) => (
          <option key={place.id} value={place.name}>
            {place.name}
          </option>
        ))}
        <option value={OTHER}>{t('otherPlace')}</option>
      </Select>
      {choice === OTHER && (
        <TextInput value={text} error={error} onChange={(e) => setText(e.target.value)} />
      )}
    </>
  );
}

export default function TripLogPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const { ready, profile } = useRequireRole('driver');
  const picker = useTruckPicker(user?.uid, { restrict: true });
  const { save, saving, status, error, saved } = useSaveLog();

  const [places, setPlaces] = useState([]);
  const [originChoice, setOriginChoice] = useState('');
  const [originText, setOriginText] = useState('');
  const [destChoice, setDestChoice] = useState('');
  const [destText, setDestText] = useState('');
  const [tonnage, setTonnage] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchPlaces()
      .then(setPlaces)
      .catch((err) => console.error('[EZRM] could not load places', err));
  }, []);

  if (!ready) return <FullPageSpinner />;

  const resolve = (choice, text) =>
    places.length ? (choice === OTHER ? text.trim() : choice) : text.trim();

  const origin = resolve(originChoice, originText);
  const destination = resolve(destChoice, destText);

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {
      truck: picker.truck ? null : t('required'),
      origin: validateRequired(origin, t),
      destination: validateRequired(destination, t),
      tonnage: validateRequired(tonnage, t),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    const entry = {
      type: 'trip',
      truck: picker.truck,
      profile,
      uid: user.uid,
      data: { origin, destination, tonnage: numberOrText(tonnage) },
    };

    await save(() => addLog(entry), entry, () => {
      picker.remember();
      setOriginChoice('');
      setOriginText('');
      setDestChoice('');
      setDestText('');
      setTonnage('');
      setErrors({});
    });
  };

  return (
    <Layout title={t('tripLog')} back="/driver">
      <form className="card" onSubmit={onSubmit} noValidate>
        <SaveStatus status={status} error={error} />

        <TruckSelect picker={picker} error={errors.truck} />

        <PlaceField
          label={t('origin')}
          places={places}
          choice={originChoice}
          setChoice={setOriginChoice}
          text={originText}
          setText={setOriginText}
          error={errors.origin}
        />

        <PlaceField
          label={t('destination')}
          places={places}
          choice={destChoice}
          setChoice={setDestChoice}
          text={destText}
          setText={setDestText}
          error={errors.destination}
        />

        <NumberInput
          label={t('tonnage')}
          value={tonnage}
          error={errors.tonnage}
          onChange={(e) => setTonnage(e.target.value)}
        />

        <button className="btn" type="submit" disabled={saving}>
          {saving ? t('saving') : t('save')}
        </button>
      </form>

      <RecentEntries
        entries={saved}
        describe={(entry) => `${entry.origin} → ${entry.destination} · ${entry.tonnage}`}
      />
    </Layout>
  );
}

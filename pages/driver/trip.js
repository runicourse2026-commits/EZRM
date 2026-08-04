import { useState } from 'react';
import Layout, { FullPageSpinner } from '@/components/Layout';
import { NumberInput, TextInput } from '@/components/Fields';
import TruckSelect, { useTruckPicker } from '@/components/TruckSelect';
import RecentEntries from '@/components/RecentEntries';
import SaveStatus from '@/components/SaveStatus';
import { useLang } from '@/lib/i18n';
import { useAuth, useRequireRole } from '@/lib/auth';
import { addLog } from '@/lib/db';
import { useSaveLog } from '@/lib/useSaveLog';
import { numberOrText, validateRequired } from '@/lib/validate';

export default function TripLogPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const { ready, profile } = useRequireRole('driver');
  const picker = useTruckPicker(user?.uid, { restrict: true });
  const { save, saving, status, error, saved } = useSaveLog();

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [tonnage, setTonnage] = useState('');
  const [errors, setErrors] = useState({});

  if (!ready) return <FullPageSpinner />;

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
      data: {
        origin: origin.trim(),
        destination: destination.trim(),
        tonnage: numberOrText(tonnage),
      },
    };

    await save(() => addLog(entry), entry, () => {
      picker.remember();
      setOrigin('');
      setDestination('');
      setTonnage('');
      setErrors({});
    });
  };

  return (
    <Layout title={t('tripLog')} back="/driver">
      <form className="card" onSubmit={onSubmit} noValidate>
        <SaveStatus status={status} error={error} />

        <TruckSelect picker={picker} error={errors.truck} />

        <TextInput
          label={t('origin')}
          value={origin}
          error={errors.origin}
          onChange={(e) => setOrigin(e.target.value)}
        />

        <TextInput
          label={t('destination')}
          value={destination}
          error={errors.destination}
          onChange={(e) => setDestination(e.target.value)}
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

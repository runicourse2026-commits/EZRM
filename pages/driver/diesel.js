import { useState } from 'react';
import Layout, { FullPageSpinner } from '@/components/Layout';
import { NumberInput } from '@/components/Fields';
import TruckSelect, { useTruckPicker } from '@/components/TruckSelect';
import RecentEntries from '@/components/RecentEntries';
import SaveStatus from '@/components/SaveStatus';
import { useLang } from '@/lib/i18n';
import { useAuth, useRequireRole } from '@/lib/auth';
import { addLog } from '@/lib/db';
import { useSaveLog } from '@/lib/useSaveLog';
import { digitsOnly, normalizeDigits, numberOrText, validateRequired } from '@/lib/validate';

export default function DieselLogPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const { ready, profile } = useRequireRole('driver');
  const picker = useTruckPicker(user?.uid);
  const { save, saving, status, error, saved } = useSaveLog();

  const [odometer, setOdometer] = useState('');
  const [liters, setLiters] = useState('');
  const [errors, setErrors] = useState({});

  if (!ready) return <FullPageSpinner />;

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {
      truck: picker.truck ? null : t('required'),
      odometer: validateRequired(odometer, t),
      liters: validateRequired(liters, t),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    const entry = {
      type: 'diesel',
      truck: picker.truck,
      profile,
      uid: user.uid,
      data: { odometer: normalizeDigits(odometer), liters: numberOrText(liters) },
    };

    await save(() => addLog(entry), entry, () => {
      picker.remember();
      setOdometer('');
      setLiters('');
      setErrors({});
    });
  };

  return (
    <Layout title={t('dieselLog')} back="/driver">
      <form className="card" onSubmit={onSubmit} noValidate>
        <SaveStatus status={status} error={error} />

        <TruckSelect picker={picker} error={errors.truck} />

        <NumberInput
          label={t('odometer')}
          hint={t('odometerHint')}
          decimal={false}
          maxLength={4}
          value={odometer}
          error={errors.odometer}
          onChange={(e) => setOdometer(digitsOnly(e.target.value, 4))}
        />

        <NumberInput
          label={t('liters')}
          value={liters}
          error={errors.liters}
          onChange={(e) => setLiters(e.target.value)}
        />

        <button className="btn" type="submit" disabled={saving}>
          {saving ? t('saving') : t('save')}
        </button>
      </form>

      <RecentEntries
        entries={saved}
        describe={(entry) => `${entry.liters} ${t('liters')} · ${entry.odometer}`}
      />
    </Layout>
  );
}

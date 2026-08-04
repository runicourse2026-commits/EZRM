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

export default function UreaLogPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const { ready, profile } = useRequireRole('driver');
  const picker = useTruckPicker(user?.uid);
  const { save, saving, status, error, saved } = useSaveLog();

  const [odometer, setOdometer] = useState('');
  const [gallons, setGallons] = useState('');
  const [errors, setErrors] = useState({});

  if (!ready) return <FullPageSpinner />;

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {
      truck: picker.truck ? null : t('required'),
      odometer: validateRequired(odometer, t),
      gallons: validateRequired(gallons, t),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    const entry = {
      type: 'urea',
      truck: picker.truck,
      profile,
      uid: user.uid,
      data: { odometer: normalizeDigits(odometer), gallons: numberOrText(gallons) },
    };

    await save(() => addLog(entry), entry, () => {
      picker.remember();
      setOdometer('');
      setGallons('');
      setErrors({});
    });
  };

  return (
    <Layout title={t('ureaLog')} back="/driver">
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
          label={t('gallons')}
          value={gallons}
          error={errors.gallons}
          onChange={(e) => setGallons(e.target.value)}
        />

        <button className="btn" type="submit" disabled={saving}>
          {saving ? t('saving') : t('save')}
        </button>
      </form>

      <RecentEntries
        entries={saved}
        describe={(entry) => `${entry.gallons} ${t('gallons')} · ${entry.odometer}`}
      />
    </Layout>
  );
}

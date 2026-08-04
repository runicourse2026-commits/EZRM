import { useState } from 'react';
import Layout, { FullPageSpinner } from '@/components/Layout';
import { TextArea } from '@/components/Fields';
import TruckSelect, { useTruckPicker } from '@/components/TruckSelect';
import RecentEntries from '@/components/RecentEntries';
import SaveStatus from '@/components/SaveStatus';
import { useLang } from '@/lib/i18n';
import { useAuth, useRequireRole } from '@/lib/auth';
import { addLog } from '@/lib/db';
import { useSaveLog } from '@/lib/useSaveLog';
import { validateRequired } from '@/lib/validate';

export default function MaintenanceLogPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const { ready, profile } = useRequireRole('mechanic');
  const picker = useTruckPicker(user?.uid);
  const { save, saving, status, error, saved } = useSaveLog();

  const [work, setWork] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  if (!ready) return <FullPageSpinner />;

  const onSubmit = async (e) => {
    e.preventDefault();
    // Work performed is the one genuinely required field; notes are optional.
    const next = {
      truck: picker.truck ? null : t('required'),
      work: validateRequired(work, t),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    const entry = {
      type: 'maintenance',
      truck: picker.truck,
      profile,
      uid: user.uid,
      data: { work: work.trim(), notes: notes.trim() },
    };

    await save(() => addLog(entry), entry, () => {
      picker.remember();
      setWork('');
      setNotes('');
      setErrors({});
    });
  };

  return (
    <Layout title={t('maintenanceLog')} back="/mechanic">
      <form className="card" onSubmit={onSubmit} noValidate>
        <SaveStatus status={status} error={error} />

        <TruckSelect picker={picker} error={errors.truck} />

        <TextArea
          label={t('workPerformed')}
          value={work}
          error={errors.work}
          onChange={(e) => setWork(e.target.value)}
        />

        <TextArea
          label={`${t('notes')} (${t('optional')})`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button className="btn" type="submit" disabled={saving}>
          {saving ? t('saving') : t('save')}
        </button>
      </form>

      <RecentEntries entries={saved} describe={(entry) => entry.work} />
    </Layout>
  );
}

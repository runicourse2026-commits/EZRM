import { useEffect, useState } from 'react';
import Layout, { FullPageSpinner } from '@/components/Layout';
import MenuItem from '@/components/MenuItem';
import { useLang } from '@/lib/i18n';
import { useRequireRole } from '@/lib/auth';
import {
  fetchBackupMarker,
  fetchLogs,
  fetchStaffNames,
  previousMonthRange,
  setBackupMarker,
} from '@/lib/db';
import { exportLogsCsv } from '@/lib/exportLogs';

/**
 * The monthly Excel download is the company's backup (the free Firebase tier
 * has no automatic ones), so the panel nags every new month until last
 * month's copy has been downloaded.
 */
function BackupReminder({ onDone }) {
  const { t, lang } = useLang();
  const [due, setDue] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchBackupMarker()
      .then((lastMonth) => setDue(lastMonth !== previousMonthRange().key))
      .catch(() => {});
  }, []);

  if (!due) return null;

  const onDownload = async () => {
    setBusy(true);
    try {
      const { first, last, key } = previousMonthRange();
      const [rows, names] = await Promise.all([fetchLogs(first, last), fetchStaffNames()]);
      exportLogsCsv(rows, { t, lang, names, filename: `ezrm-logs-${key}.csv` });
      await setBackupMarker(key);
      setDue(false);
      onDone?.();
    } catch (err) {
      console.error('[EZRM] monthly backup download failed', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="banner offline" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <span style={{ flex: 1, minWidth: 180 }}>📥 {t('backupReminder')}</span>
      <button type="button" className="btn small" onClick={onDownload} disabled={busy}>
        {busy ? t('downloading') : t('downloadLastMonth')}
      </button>
    </div>
  );
}

export default function ManagerHome() {
  const { t } = useLang();
  const { ready, profile } = useRequireRole('manager');
  const [backupDone, setBackupDone] = useState(false);

  if (!ready) return <FullPageSpinner />;

  return (
    <Layout title={t('managerPanel')} subtitle={profile.name} back={false}>
      {backupDone && <div className="banner success">{t('backupDone')}</div>}
      {!backupDone && <BackupReminder onDone={() => setBackupDone(true)} />}
      <div className="menu">
        <MenuItem icon="📋" label={t('allLogs')} hint={t('viewAllLogs')} href="/manager/logs" />
        <MenuItem icon="🚛" label={t('trucks')} hint={t('manageTrucks')} href="/manager/trucks" />
        <MenuItem icon="🗺️" label={t('places')} hint={t('managePlaces')} href="/manager/places" />
        <MenuItem
          icon="💵"
          label={t('payments')}
          hint={t('managePayments')}
          href="/manager/payments"
        />
        <MenuItem
          icon="👷"
          label={t('staffAccounts')}
          hint={t('manageStaffAccounts')}
          href="/manager/users"
        />
      </div>
    </Layout>
  );
}

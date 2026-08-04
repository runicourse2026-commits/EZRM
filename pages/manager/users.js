import { useEffect, useState } from 'react';
import Layout, { FullPageSpinner } from '@/components/Layout';
import { TextInput } from '@/components/Fields';
import { useLang } from '@/lib/i18n';
import { useRequireRole } from '@/lib/auth';
import { fetchStaffUsers, setStaffPassword } from '@/lib/adminApi';

/** One row: an account plus its own "set new password" mini-form. */
function StaffRow({ staff, onSaved }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (value.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }
    setBusy(true);
    try {
      await setStaffPassword(staff.uid, value);
      setDone(true);
      setValue('');
      setOpen(false);
      onSaved?.();
    } catch (err) {
      console.error('[EZRM] set password failed', err);
      setError(t('genericError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li style={{ display: 'block' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
        <div className="grow">
          <div className="title">{staff.employeeId}</div>
          <div className="meta">{t(staff.role)}</div>
        </div>
        <button type="button" className="btn secondary small" onClick={() => setOpen((v) => !v)}>
          🔑 {t('changePassword')}
        </button>
      </div>

      {open && (
        <form onSubmit={onSubmit} noValidate style={{ marginTop: 10 }}>
          <TextInput
            label={`${t('setNewPasswordFor')} ${staff.employeeId}`}
            type="password"
            value={value}
            error={error}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="new-password"
          />
          <button className="btn small" type="submit" disabled={busy}>
            {busy ? t('saving') : t('setPassword')}
          </button>
        </form>
      )}
      {done && <div className="banner success" style={{ marginTop: 10 }}>{t('passwordSetFor')}</div>}
    </li>
  );
}

export default function StaffAccountsPage() {
  const { t } = useLang();
  const { ready } = useRequireRole('manager');

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchStaffUsers()
      .then(setStaff)
      .catch((err) => {
        console.error('[EZRM] could not load staff accounts', err);
        setError(err.message === 'admin-not-configured' ? t('adminNotConfigured') : t('genericError'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (ready) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!ready) return <FullPageSpinner />;

  return (
    <Layout title={t('staffAccounts')} subtitle={t('manageStaffAccounts')} back="/manager">
      <div className="card">
        {loading ? (
          <FullPageSpinner />
        ) : error ? (
          <div className="banner error">{error}</div>
        ) : !staff.length ? (
          <p className="muted" style={{ margin: 0 }}>
            {t('noStaffAccounts')}
          </p>
        ) : (
          <ul className="list">
            {staff.map((s) => (
              <StaffRow key={s.uid} staff={s} onSaved={load} />
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}

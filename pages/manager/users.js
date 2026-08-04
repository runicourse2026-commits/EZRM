import { useEffect, useState } from 'react';
import Layout, { FullPageSpinner } from '@/components/Layout';
import { TextInput } from '@/components/Fields';
import { useLang } from '@/lib/i18n';
import { useRequireRole } from '@/lib/auth';
import { fetchStaffUsers, setStaffPassword } from '@/lib/adminApi';
import { fetchDriverTruckIds, fetchTrucks, setDriverTrucks } from '@/lib/db';

/** The password mini-form, shared by every account regardless of role. */
function PasswordForm({ staff }) {
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
    } catch (err) {
      console.error('[EZRM] set password failed', err);
      setError(t('genericError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" className="btn secondary small" onClick={() => setOpen((v) => !v)}>
        🔑 {t('changePassword')}
      </button>

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
    </>
  );
}

/** Truck-assignment mini-form, drivers only — the mechanic services any truck. */
function TruckAssignForm({ staff, trucks }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    setDone(false);
    if (next && !loading) {
      setLoading(true);
      fetchDriverTruckIds(staff.uid)
        .then(setSelected)
        .catch((err) => console.error('[EZRM] could not load truck assignment', err))
        .finally(() => setLoading(false));
    }
  };

  const toggleTruck = (id) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((t) => t !== id) : [...current, id]
    );
  };

  const onSave = async () => {
    setBusy(true);
    try {
      await setDriverTrucks(staff.uid, selected);
      setDone(true);
    } catch (err) {
      console.error('[EZRM] could not save truck assignment', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" className="btn secondary small" onClick={toggleOpen}>
        🚛 {t('assignTrucks')}
      </button>

      {open && (
        <div style={{ marginTop: 10 }}>
          {loading ? (
            <FullPageSpinner />
          ) : !trucks.length ? (
            <p className="muted" style={{ margin: 0 }}>
              {t('noTrucks')}
            </p>
          ) : (
            <div className="stack">
              {trucks.map((truck) => (
                <label key={truck.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={selected.includes(truck.id)}
                    onChange={() => toggleTruck(truck.id)}
                  />
                  {truck.plate ? `${truck.number} — ${truck.plate}` : truck.number}
                </label>
              ))}
              <p className="hint" style={{ margin: 0 }}>
                {t('assignTrucksHint')}
              </p>
              <button type="button" className="btn small" onClick={onSave} disabled={busy}>
                {busy ? t('saving') : t('save')}
              </button>
            </div>
          )}
        </div>
      )}
      {done && <div className="banner success" style={{ marginTop: 10 }}>{t('trucksAssigned')}</div>}
    </>
  );
}

function StaffRow({ staff, trucks }) {
  const { t } = useLang();
  return (
    <li style={{ display: 'block' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
        <div className="grow">
          <div className="title">{staff.employeeId}</div>
          <div className="meta">{t(staff.role)}</div>
        </div>
        <div className="btn-row" style={{ width: 'auto' }}>
          {staff.role === 'driver' && <TruckAssignForm staff={staff} trucks={trucks} />}
          <PasswordForm staff={staff} />
        </div>
      </div>
    </li>
  );
}

export default function StaffAccountsPage() {
  const { t } = useLang();
  const { ready } = useRequireRole('manager');

  const [staff, setStaff] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    setError(null);
    Promise.all([fetchStaffUsers(), fetchTrucks()])
      .then(([staffList, truckList]) => {
        setStaff(staffList);
        setTrucks(truckList);
      })
      .catch((err) => {
        console.error('[EZRM] could not load staff accounts', err);
        setError(err.message === 'admin-not-configured' ? t('adminNotConfigured') : t('genericError'));
      })
      .finally(() => setLoading(false));
  }, [ready, t]);

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
              <StaffRow key={s.uid} staff={s} trucks={trucks} />
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}

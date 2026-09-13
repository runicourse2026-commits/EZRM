import { useCallback, useEffect, useMemo, useState } from 'react';
import Layout, { FullPageSpinner } from '@/components/Layout';
import { Field, Select } from '@/components/Fields';
import { useLang } from '@/lib/i18n';
import { useAuth, useRequireRole } from '@/lib/auth';
import {
  LOG_TYPES,
  computeConsumption,
  deleteLog,
  fetchLogs,
  fetchStaffNames,
  fetchTrucks,
  formatDateTime,
  logTypeLabel,
  restoreLog,
  voidLog,
} from '@/lib/db';
import { exportLogsCsv } from '@/lib/exportLogs';
import { stamp } from '@/lib/csv';

/** One-line human summary of an entry, for the table's Details column. */
function describe(entry, t) {
  switch (entry.type) {
    case 'diesel':
      return `${entry.liters ?? ''} ${t('liters')}`;
    case 'urea':
      return `${entry.gallons ?? ''} ${t('gallons')}`;
    case 'trip':
      return `${entry.origin ?? ''} → ${entry.destination ?? ''} · ${entry.tonnage ?? ''}`;
    case 'maintenance':
      return [entry.work, entry.notes].filter(Boolean).join(' — ');
    default:
      return '';
  }
}

const toInputDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;

/** Default view: the last 30 days. Older months load by moving the from-date. */
function defaultFrom() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return toInputDate(date);
}

export default function LogsPage() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const { ready } = useRequireRole('manager');

  const [logs, setLogs] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [names, setNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('all');
  const [truckId, setTruckId] = useState('all');
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState('');
  const [voidedOnly, setVoidedOnly] = useState(false);

  // The date range drives the Firestore query itself, so reads stay
  // proportional to the period being inspected; the rest of the filters are
  // applied in memory on whatever the range brought back.
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const fromDate = from ? new Date(`${from}T00:00:00`) : null;
      const toDate = to ? new Date(`${to}T23:59:59`) : null;
      const [logList, truckList, nameMap] = await Promise.all([
        fetchLogs(fromDate, toDate),
        fetchTrucks(),
        fetchStaffNames(),
      ]);
      setLogs(logList);
      setTrucks(truckList);
      setNames(nameMap);
    } catch (err) {
      console.error('[EZRM] could not load logs', err);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      logs.filter((entry) => {
        if (voidedOnly && !entry.voided) return false;
        if (type !== 'all' && entry.type !== type) return false;
        if (truckId !== 'all' && entry.truckId !== truckId) return false;
        return true;
      }),
    [logs, type, truckId, voidedOnly]
  );

  const consumption = useMemo(() => computeConsumption(logs), [logs]);
  const voidedCount = useMemo(() => logs.filter((entry) => entry.voided).length, [logs]);

  if (!ready) return <FullPageSpinner />;

  const displayName = (entry) => names[entry.uid] || entry.userName || '';

  const patchEntry = (id, patch) =>
    setLogs((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );

  const onVoid = async (entry) => {
    if (!window.confirm(`${t('confirmVoid')}\n${describe(entry, t)}`)) return;
    try {
      await voidLog(entry.id, user?.uid);
      patchEntry(entry.id, { voided: true });
    } catch (err) {
      console.error('[EZRM] void entry failed', err);
    }
  };

  const onRestore = async (entry) => {
    try {
      await restoreLog(entry.id);
      patchEntry(entry.id, { voided: false });
    } catch (err) {
      console.error('[EZRM] restore entry failed', err);
    }
  };

  const onDelete = async (entry) => {
    if (!window.confirm(`${t('confirmDeleteEntry')}\n${describe(entry, t)}`)) return;
    try {
      await deleteLog(entry.id);
      setLogs((current) => current.filter((item) => item.id !== entry.id));
    } catch (err) {
      console.error('[EZRM] delete entry failed', err);
    }
  };

  const onExport = () =>
    exportLogsCsv(filtered, { t, lang, names, filename: `ezrm-logs-${stamp()}.csv` });

  return (
    <Layout title={t('allLogs')} back="/manager">
      {voidedCount > 0 && (
        <div className="banner offline" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: 1 }}>
            ⛔ {t('voidedEntries')}: <strong>{voidedCount}</strong>
          </span>
          <button
            type="button"
            className="btn secondary small"
            onClick={() => setVoidedOnly((v) => !v)}
          >
            {voidedOnly ? t('showAllEntries') : t('showVoidedOnly')}
          </button>
        </div>
      )}

      <div className="card">
        <div className="filters">
          <Select label={t('filterType')} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">{t('all')}</option>
            {LOG_TYPES.map((value) => (
              <option key={value} value={value}>
                {logTypeLabel(value, t)}
              </option>
            ))}
          </Select>

          <Select
            label={t('filterTruck')}
            value={truckId}
            onChange={(e) => setTruckId(e.target.value)}
          >
            <option value="all">{t('all')}</option>
            {trucks.map((truck) => (
              <option key={truck.id} value={truck.id}>
                {truck.number}
              </option>
            ))}
          </Select>

          <Field label={t('from')}>
            <input
              className="input"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Field>

          <Field label={t('to')}>
            <input
              className="input"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </Field>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 16,
            flexWrap: 'wrap',
          }}
        >
          <span className="muted">
            {t('resultsCount')}: <strong>{filtered.length}</strong>
          </span>
          <span style={{ flex: 1 }} />
          <button type="button" className="btn secondary small" onClick={load} disabled={loading}>
            {t('refresh')}
          </button>
          <button type="button" className="btn small" onClick={onExport} disabled={!filtered.length}>
            {t('exportCsv')}
          </button>
        </div>
      </div>

      {loading ? (
        <FullPageSpinner />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('dateTime')}</th>
                <th>{t('type')}</th>
                <th>{t('truck')}</th>
                <th>{t('user')}</th>
                <th>{t('odometer')}</th>
                <th>{t('details')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {!filtered.length && (
                <tr>
                  <td colSpan={7} className="muted center">
                    {t('noEntries')}
                  </td>
                </tr>
              )}
              {filtered.map((entry) => {
                const usage = consumption[entry.id];
                return (
                  <tr key={entry.id} className={entry.voided ? 'flagged' : undefined}>
                    <td>{formatDateTime(entry.at, lang)}</td>
                    <td>{logTypeLabel(entry.type, t)}</td>
                    <td>{entry.truckNumber}</td>
                    <td>{displayName(entry)}</td>
                    <td>{entry.odometer ?? '—'}</td>
                    <td style={{ whiteSpace: 'normal', minWidth: 220 }}>
                      <span className={entry.voided ? 'voided' : undefined}>
                        {describe(entry, t)}
                        {usage && (
                          <span className="muted">
                            {' '}
                            · {usage.km} {t('km')}
                            {usage.rate ? ` · ${usage.rate.toFixed(1)} ${t('kmPerLiter')}` : ''}
                          </span>
                        )}
                      </span>{' '}
                      {entry.voided && <span className="pill voided-pill">⛔ {t('voided')}</span>}
                      {entry.pending && <span className="pill pending">{t('pendingSync')}</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {entry.voided ? (
                          <>
                            <button
                              type="button"
                              className="btn danger small"
                              onClick={() => onDelete(entry)}
                            >
                              🗑️ {t('deleteForever')}
                            </button>
                            <button
                              type="button"
                              className="btn secondary small"
                              onClick={() => onRestore(entry)}
                            >
                              ↩️ {t('restoreEntry')}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="btn secondary small"
                            onClick={() => onVoid(entry)}
                          >
                            ⛔ {t('voidEntry')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}

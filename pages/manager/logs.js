import { useCallback, useEffect, useMemo, useState } from 'react';
import Layout, { FullPageSpinner } from '@/components/Layout';
import { Field, Select } from '@/components/Fields';
import { useLang } from '@/lib/i18n';
import { useRequireRole } from '@/lib/auth';
import {
  LOG_TYPES,
  fetchLogs,
  fetchTrucks,
  formatDateTime,
  logTypeLabel,
  toDate,
} from '@/lib/db';
import { downloadCsv, stamp } from '@/lib/csv';

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

export default function LogsPage() {
  const { t, lang } = useLang();
  const { ready } = useRequireRole('manager');

  const [logs, setLogs] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('all');
  const [truckId, setTruckId] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [logList, truckList] = await Promise.all([fetchLogs(), fetchTrucks()]);
      setLogs(logList);
      setTrucks(truckList);
    } catch (err) {
      console.error('[EZRM] could not load logs', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Filtering is in memory: the rows are already here, so this is instant and
  // costs no extra Firestore reads as the manager changes filters.
  const filtered = useMemo(() => {
    const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const toTime = to ? new Date(`${to}T23:59:59`).getTime() : null;

    return logs.filter((entry) => {
      if (type !== 'all' && entry.type !== type) return false;
      if (truckId !== 'all' && entry.truckId !== truckId) return false;
      if (fromTime || toTime) {
        const time = toDate(entry.at)?.getTime();
        if (!time) return false;
        if (fromTime && time < fromTime) return false;
        if (toTime && time > toTime) return false;
      }
      return true;
    });
  }, [logs, type, truckId, from, to]);

  if (!ready) return <FullPageSpinner />;

  const onExport = () => {
    const headers = [
      t('dateTime'),
      t('type'),
      t('truck'),
      t('user'),
      t('odometer'),
      t('liters'),
      t('gallons'),
      t('origin'),
      t('destination'),
      t('tonnage'),
      t('workPerformed'),
      t('notes'),
    ];
    const rows = filtered.map((entry) => [
      formatDateTime(entry.at, lang),
      logTypeLabel(entry.type, t),
      entry.truckNumber ?? '',
      entry.userName ?? '',
      entry.odometer ?? '',
      entry.liters ?? '',
      entry.gallons ?? '',
      entry.origin ?? '',
      entry.destination ?? '',
      entry.tonnage ?? '',
      entry.work ?? '',
      entry.notes ?? '',
    ]);
    downloadCsv(`ezrm-logs-${stamp()}.csv`, headers, rows);
  };

  return (
    <Layout title={t('allLogs')} back="/manager">
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
              </tr>
            </thead>
            <tbody>
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="muted center">
                    {t('noEntries')}
                  </td>
                </tr>
              )}
              {filtered.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDateTime(entry.at, lang)}</td>
                  <td>{logTypeLabel(entry.type, t)}</td>
                  <td>{entry.truckNumber}</td>
                  <td>{entry.userName}</td>
                  <td>{entry.odometer ?? '—'}</td>
                  <td style={{ whiteSpace: 'normal', minWidth: 220 }}>
                    {describe(entry, t)}{' '}
                    {entry.pending && <span className="pill pending">{t('pendingSync')}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}

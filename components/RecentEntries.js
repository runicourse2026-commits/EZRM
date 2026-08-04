import { useLang } from '@/lib/i18n';
import { useOnline } from '@/lib/useOnline';
import { formatDateTime } from '@/lib/db';

/**
 * A running list of what this user has saved since opening the page — a plain
 * "yes, it went through" receipt. It is built from local state rather than a
 * query, so it costs nothing to display and works identically offline.
 */
export default function RecentEntries({ entries, describe }) {
  const { t, lang } = useLang();
  const online = useOnline();

  if (!entries.length) return null;

  return (
    <div className="card">
      <h2>{t('recentEntries')}</h2>
      <ul className="list">
        {entries.map((entry) => (
          <li key={entry.key}>
            <div className="grow">
              <div className="title">{describe(entry)}</div>
              <div className="meta">
                {entry.truckNumber} · {formatDateTime(entry.at, lang)}
              </div>
            </div>
            {!online && <span className="pill pending">{t('pendingSync')}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

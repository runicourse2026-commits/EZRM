import { useState } from 'react';
import { useLang } from '@/lib/i18n';
import { useOnline } from '@/lib/useOnline';
import { formatDateTime, voidLog } from '@/lib/db';
import { useAuth } from '@/lib/auth';

/**
 * A running list of what this user has saved since opening the page — a plain
 * "yes, it went through" receipt built from local state, so it costs nothing
 * to display and works identically offline.
 *
 * Each entry carries a void button: tapping it marks the entry cancelled.
 * The row stays in the company record (struck through, for the manager to
 * see); only the manager can truly delete it. The void write queues offline
 * like any other write.
 */
export default function RecentEntries({ entries, describe }) {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const online = useOnline();
  const [voided, setVoided] = useState(() => new Set());

  if (!entries.length) return null;

  const onVoid = (entry) => {
    if (!window.confirm(`${t('confirmVoid')}\n${describe(entry)}`)) return;
    // Fire-and-forget: the local cache applies it instantly, and awaiting the
    // server ack would hang the button offline.
    voidLog(entry.id, user?.uid).catch((err) => console.error('[EZRM] void failed', err));
    setVoided((current) => new Set(current).add(entry.id));
  };

  return (
    <div className="card">
      <h2>{t('recentEntries')}</h2>
      <ul className="list">
        {entries.map((entry) => {
          const isVoided = entry.id && voided.has(entry.id);
          return (
            <li key={entry.key}>
              <div className="grow">
                <div className={`title${isVoided ? ' voided' : ''}`}>{describe(entry)}</div>
                <div className="meta">
                  {entry.truckNumber} · {formatDateTime(entry.at, lang)}
                </div>
              </div>
              {isVoided ? (
                <span className="pill voided-pill">⛔ {t('voided')}</span>
              ) : (
                <>
                  {!online && <span className="pill pending">{t('pendingSync')}</span>}
                  {entry.id && (
                    <button
                      type="button"
                      className="btn danger small"
                      onClick={() => onVoid(entry)}
                    >
                      ⛔ {t('voidEntry')}
                    </button>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

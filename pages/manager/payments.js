import { useEffect, useState } from 'react';
import Layout, { FullPageSpinner } from '@/components/Layout';
import { NumberInput, TextInput } from '@/components/Fields';
import SaveStatus from '@/components/SaveStatus';
import { useLang } from '@/lib/i18n';
import { useAuth, useRequireRole } from '@/lib/auth';
import { addPayment, buildPayment, fetchPayments, formatDateTime } from '@/lib/db';
import { useSaveLog } from '@/lib/useSaveLog';
import { numberOrText, validateRequired } from '@/lib/validate';
import { downloadCsv, stamp } from '@/lib/csv';

export default function PaymentsPage() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const { ready, profile } = useRequireRole('manager');
  const { save, saving, status, error } = useSaveLog();

  const [payments, setPayments] = useState([]);
  const [paidTo, setPaidTo] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchPayments().then(setPayments).catch(console.error);
  }, []);

  if (!ready) return <FullPageSpinner />;

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {
      paidTo: validateRequired(paidTo, t),
      amount: validateRequired(amount, t),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    const payment = {
      paidTo,
      amount: numberOrText(amount),
      note,
      profile,
      uid: user.uid,
    };

    await save(() => addPayment(payment), null, () => {
      // Show it straight away instead of paying for another read.
      setPayments((current) => [
        { id: `local-${Date.now()}`, ...buildPayment(payment), at: new Date() },
        ...current,
      ]);
      setPaidTo('');
      setAmount('');
      setNote('');
      setErrors({});
    });
  };

  const onExport = () => {
    downloadCsv(
      `ezrm-payments-${stamp()}.csv`,
      [t('dateTime'), t('paidTo'), t('amount'), t('paymentNote')],
      payments.map((p) => [formatDateTime(p.at, lang), p.paidTo, p.amount, p.note ?? ''])
    );
  };

  return (
    <Layout title={t('payments')} back="/manager">
      <form className="card" onSubmit={onSubmit} noValidate>
        <h2>{t('addPayment')}</h2>
        <SaveStatus status={status} error={error} />

        <TextInput
          label={t('paidTo')}
          value={paidTo}
          error={errors.paidTo}
          onChange={(e) => setPaidTo(e.target.value)}
        />
        <NumberInput
          label={t('amount')}
          value={amount}
          error={errors.amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <TextInput
          label={`${t('paymentNote')} (${t('optional')})`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <button className="btn" type="submit" disabled={saving}>
          {saving ? t('saving') : t('addPayment')}
        </button>
      </form>

      <div className="card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 8,
            flexWrap: 'wrap',
          }}
        >
          <h2 style={{ margin: 0 }}>
            {t('paymentsList')} ({payments.length})
          </h2>
          <span style={{ flex: 1 }} />
          <button
            type="button"
            className="btn small"
            onClick={onExport}
            disabled={!payments.length}
          >
            {t('exportCsv')}
          </button>
        </div>

        {!payments.length ? (
          <p className="muted" style={{ margin: 0 }}>
            {t('noEntries')}
          </p>
        ) : (
          <ul className="list">
            {payments.map((payment) => (
              <li key={payment.id}>
                <div className="grow">
                  <div className="title">
                    {payment.paidTo} — {payment.amount}
                  </div>
                  <div className="meta">
                    {formatDateTime(payment.at, lang)}
                    {payment.note ? ` · ${payment.note}` : ''}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}

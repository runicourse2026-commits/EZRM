import { useState } from 'react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import Layout, { FullPageSpinner } from '@/components/Layout';
import { TextInput } from '@/components/Fields';
import { useLang } from '@/lib/i18n';
import { useAuth, useRequireRole } from '@/lib/auth';
import { validateRequired } from '@/lib/validate';

/**
 * Self-service password change for any signed-in role. Firebase requires a
 * fresh sign-in before a sensitive change like this, so the current password
 * is used to re-authenticate first rather than trusting the existing session.
 */
export default function ChangePasswordPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const { ready } = useRequireRole(['driver', 'mechanic', 'manager']);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState(null);

  if (!ready) return <FullPageSpinner />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setDone(false);
    setFormError(null);

    const next2 = {
      current: validateRequired(current, t),
      next: next.length < 6 ? t('passwordTooShort') : null,
      confirm: next !== confirm ? t('passwordMismatch') : null,
    };
    setErrors(next2);
    if (Object.values(next2).some(Boolean)) return;

    setBusy(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, next);
      setDone(true);
      setCurrent('');
      setNext('');
      setConfirm('');
      setErrors({});
    } catch (err) {
      console.error('[EZRM] password change failed', err);
      setFormError(
        err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential'
          ? t('wrongCurrentPassword')
          : t('genericError')
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout title={t('changePassword')}>
      <form className="card" onSubmit={onSubmit} noValidate>
        {done && <div className="banner success">{t('passwordChanged')}</div>}
        {formError && <div className="banner error">{formError}</div>}

        <TextInput
          label={t('currentPassword')}
          type="password"
          value={current}
          error={errors.current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
        />
        <TextInput
          label={t('newPassword')}
          type="password"
          value={next}
          error={errors.next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
        />
        <TextInput
          label={t('confirmPassword')}
          type="password"
          value={confirm}
          error={errors.confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />

        <button className="btn" type="submit" disabled={busy}>
          {busy ? t('saving') : t('changePassword')}
        </button>
      </form>
    </Layout>
  );
}

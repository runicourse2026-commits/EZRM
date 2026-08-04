import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { LangToggle, FullPageSpinner } from '@/components/Layout';
import { TextInput } from '@/components/Fields';
import { useLang } from '@/lib/i18n';
import { homeForRole, useAuth } from '@/lib/auth';
import { useOnline } from '@/lib/useOnline';

export default function LoginPage() {
  const { t } = useLang();
  const { user, profile, loading, login, logout } = useAuth();
  const router = useRouter();
  const online = useOnline();

  const [employeeId, setEmployeeId] = useState('');
  const [secret, setSecret] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Already signed in (including a session restored with no signal) — go straight in.
  useEffect(() => {
    if (loading || !user || !profile) return;
    if (!profile.role) {
      // The account authenticated but its email does not name a role, so there
      // is nowhere to send them. Better to say so than to bounce them around.
      setError(t('unknownRole'));
      setBusy(false);
      logout();
      return;
    }
    router.replace(homeForRole(profile.role));
  }, [loading, user, profile, router, logout, t]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!employeeId.trim() || !secret.trim()) {
      setError(t('required'));
      return;
    }
    setBusy(true);
    try {
      await login(employeeId, secret);
      // The effect above redirects as soon as auth state updates.
    } catch (err) {
      console.error('[EZRM] login failed', err);
      setError(
        err?.code === 'auth/network-request-failed'
          ? t('loginNeedsInternet')
          : t('wrongCredentials')
      );
      setBusy(false);
    }
  };

  if (loading || (user && profile?.role)) return <FullPageSpinner />;

  return (
    <div className="page">
      <Head>
        <title>EZRM</title>
      </Head>

      <header className="topbar">
        <span className="brand">{t('appName')}</span>
        <span className="spacer" />
        <LangToggle />
      </header>

      <main className="container" style={{ maxWidth: 460 }}>
        <div className="center" style={{ margin: '28px 0 22px' }}>
          <div style={{ fontSize: 46 }}>🚛</div>
          <h1 style={{ margin: '6px 0 2px', fontSize: 30 }}>{t('appName')}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {t('tagline')}
          </p>
        </div>

        {!online && <div className="banner offline">📴 {t('loginNeedsInternet')}</div>}

        <div className="card">
          <form onSubmit={onSubmit} noValidate>
            <TextInput
              label={t('employeeId')}
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <TextInput
              label={t('phoneOrPassword')}
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              autoComplete="current-password"
            />

            {error && <div className="banner error">{error}</div>}

            <button className="btn" type="submit" disabled={busy}>
              {busy ? t('loggingIn') : t('login')}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

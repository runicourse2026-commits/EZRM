import Head from 'next/head';
import { useRouter } from 'next/router';
import { useLang } from '@/lib/i18n';
import { useAuth, homeForRole } from '@/lib/auth';
import { useOnline } from '@/lib/useOnline';

export function LangToggle() {
  const { lang, toggle } = useLang();
  return (
    <button type="button" className="topbar-btn" onClick={toggle} aria-label="Language">
      {lang === 'ar' ? 'English' : 'العربية'}
    </button>
  );
}

export default function Layout({ title, subtitle, back, children }) {
  const { t } = useLang();
  const { profile, logout } = useAuth();
  const router = useRouter();
  const online = useOnline();

  const goBack = () => {
    if (typeof back === 'string') router.push(back);
    else router.push(homeForRole(profile?.role));
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <div className="page">
      <Head>
        <title>{title ? `${title} — EZRM` : 'EZRM'}</title>
      </Head>

      <header className="topbar">
        {back !== false && (
          <button type="button" className="topbar-btn" onClick={goBack}>
            <span className="dir-arrow" aria-hidden="true">
              ‹
            </span>{' '}
            {t('back')}
          </button>
        )}
        <span className="brand">{t('appName')}</span>
        <span className="spacer" />
        <LangToggle />
        {profile && (
          <button type="button" className="topbar-btn" onClick={handleLogout}>
            {t('logout')}
          </button>
        )}
      </header>

      {profile && (
        <div className="subbar">
          <span>
            {profile.name} · {t(profile.role)}
          </span>
          <span className="spacer" />
          <button
            type="button"
            className="subbar-link"
            onClick={() => router.push('/account/password')}
          >
            🔑 {t('changePassword')}
          </button>
        </div>
      )}

      <main className="container">
        {!online && <div className="banner offline">📴 {t('offline')}</div>}
        {title && (
          <div style={{ marginBottom: 14 }}>
            <h1 style={{ fontSize: 24, margin: '4px 0' }}>{title}</h1>
            {subtitle && <p className="muted" style={{ margin: 0 }}>{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

export function FullPageSpinner() {
  return <div className="spinner" role="status" aria-label="loading" />;
}

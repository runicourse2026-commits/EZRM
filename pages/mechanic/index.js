import Layout, { FullPageSpinner } from '@/components/Layout';
import MenuItem from '@/components/MenuItem';
import { useLang } from '@/lib/i18n';
import { useRequireRole } from '@/lib/auth';

export default function MechanicHome() {
  const { t } = useLang();
  const { ready, profile } = useRequireRole('mechanic');

  if (!ready) return <FullPageSpinner />;

  return (
    <Layout title={`${t('welcome')} ${profile.name}`} subtitle={t('chooseAction')} back={false}>
      <div className="menu">
        <MenuItem
          icon="🔧"
          label={t('maintenanceLog')}
          hint={t('workPerformed')}
          href="/mechanic/maintenance"
        />
      </div>
    </Layout>
  );
}

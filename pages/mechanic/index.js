import Layout, { FullPageSpinner } from '@/components/Layout';
import MenuItem from '@/components/MenuItem';
import { useLang } from '@/lib/i18n';
import { useRequireRole } from '@/lib/auth';
import { useDisplayName } from '@/lib/useDisplayName';

export default function MechanicHome() {
  const { t } = useLang();
  const { ready } = useRequireRole('mechanic');
  const displayName = useDisplayName();

  if (!ready) return <FullPageSpinner />;

  return (
    <Layout title={`${t('welcome')} ${displayName}`} subtitle={t('chooseAction')} back={false}>
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

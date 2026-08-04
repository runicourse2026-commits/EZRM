import Layout, { FullPageSpinner } from '@/components/Layout';
import MenuItem from '@/components/MenuItem';
import { useLang } from '@/lib/i18n';
import { useRequireRole } from '@/lib/auth';

export default function ManagerHome() {
  const { t } = useLang();
  const { ready, profile } = useRequireRole('manager');

  if (!ready) return <FullPageSpinner />;

  return (
    <Layout title={t('managerPanel')} subtitle={profile.name} back={false}>
      <div className="menu">
        <MenuItem icon="📋" label={t('allLogs')} hint={t('viewAllLogs')} href="/manager/logs" />
        <MenuItem icon="🚛" label={t('trucks')} hint={t('manageTrucks')} href="/manager/trucks" />
        <MenuItem
          icon="💵"
          label={t('payments')}
          hint={t('managePayments')}
          href="/manager/payments"
        />
      </div>
    </Layout>
  );
}

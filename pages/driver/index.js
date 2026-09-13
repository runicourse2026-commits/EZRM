import Layout, { FullPageSpinner } from '@/components/Layout';
import MenuItem from '@/components/MenuItem';
import { useLang } from '@/lib/i18n';
import { useRequireRole } from '@/lib/auth';
import { useDisplayName } from '@/lib/useDisplayName';

export default function DriverHome() {
  const { t } = useLang();
  const { ready } = useRequireRole('driver');
  const displayName = useDisplayName();

  if (!ready) return <FullPageSpinner />;

  return (
    <Layout title={`${t('welcome')} ${displayName}`} subtitle={t('chooseAction')} back={false}>
      <div className="menu">
        <MenuItem icon="⛽" label={t('dieselLog')} hint={t('liters')} href="/driver/diesel" />
        <MenuItem icon="🧪" label={t('ureaLog')} hint={t('gallons')} href="/driver/urea" />
        <MenuItem icon="🛣️" label={t('tripLog')} hint={t('tonnage')} href="/driver/trip" />
      </div>
    </Layout>
  );
}

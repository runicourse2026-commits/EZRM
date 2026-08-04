import { useLang } from '@/lib/i18n';

export default function SaveStatus({ status, error }) {
  const { t } = useLang();
  if (error) return <div className="banner error">{t('genericError')}</div>;
  if (status === 'online') return <div className="banner success">{t('savedOnline')}</div>;
  if (status === 'offline') return <div className="banner offline">{t('savedOffline')}</div>;
  return null;
}

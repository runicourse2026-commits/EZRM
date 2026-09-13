import { downloadCsv } from './csv';
import { computeConsumption, formatDateTime, logTypeLabel } from './db';

/**
 * One place that knows what the logs spreadsheet looks like, so the filtered
 * export on the logs page and the manager's monthly backup download can never
 * drift apart.
 */
export function exportLogsCsv(rows, { t, lang, names = {}, filename }) {
  const consumption = computeConsumption(rows);

  const headers = [
    t('dateTime'),
    t('type'),
    t('truck'),
    t('user'),
    t('odometer'),
    t('liters'),
    t('kmSinceLast'),
    t('kmPerLiter'),
    t('gallons'),
    t('origin'),
    t('destination'),
    t('tonnage'),
    t('workPerformed'),
    t('notes'),
    t('voided'),
  ];

  const data = rows.map((entry) => {
    const usage = consumption[entry.id];
    return [
      formatDateTime(entry.at, lang),
      logTypeLabel(entry.type, t),
      entry.truckNumber ?? '',
      names[entry.uid] || entry.userName || '',
      entry.odometer ?? '',
      entry.liters ?? '',
      usage ? usage.km : '',
      usage?.rate ? usage.rate.toFixed(1) : '',
      entry.gallons ?? '',
      entry.origin ?? '',
      entry.destination ?? '',
      entry.tonnage ?? '',
      entry.work ?? '',
      entry.notes ?? '',
      entry.voided ? t('yes') : '',
    ];
  });

  downloadCsv(filename, headers, data);
}

/**
 * CSV export sized for Excel: a UTF-8 BOM so Arabic text is not mangled, and
 * `sep=,` so Excel honours the comma separator regardless of the machine's
 * regional settings.
 */

function escapeCell(value) {
  if (value === null || value === undefined) return '';
  let str = String(value);
  // Neutralise spreadsheet formula injection (=, +, -, @ openers).
  if (/^[=+\-@]/.test(str)) str = `'${str}`;
  return `"${str.replace(/"/g, '""')}"`;
}

export function toCsv(headers, rows) {
  const lines = [
    'sep=,',
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ];
  return `﻿${lines.join('\r\n')}`;
}

export function downloadCsv(filename, headers, rows) {
  const blob = new Blob([toCsv(headers, rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const stamp = () => new Date().toISOString().slice(0, 10);

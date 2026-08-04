/**
 * Deliberately light. This app replaces a paper sheet — the point is to capture
 * what the crew writes down, not to argue with them about it. The only check is
 * "did you leave it blank".
 */

/** Accepts Arabic-Indic digits too — some phone keyboards emit them. */
export function normalizeDigits(value) {
  return String(value ?? '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٫،]/g, '.') // Arabic decimal separator
    .trim();
}

export const digitsOnly = (value, max) => normalizeDigits(value).replace(/\D/g, '').slice(0, max);

/**
 * Store a clean number when the entry is one, otherwise keep whatever was typed
 * so nothing is silently lost (and so Firestore never sees a NaN).
 */
export function numberOrText(value) {
  const raw = normalizeDigits(value);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : raw;
}

export function validateRequired(value, t) {
  return String(value ?? '').trim() ? null : t('required');
}

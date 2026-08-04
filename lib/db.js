import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

/*
 * Everything here is fetch-on-load rather than a live listener. The data does
 * not need to update in real time, and one read per page open keeps this
 * comfortably inside the Firestore free tier.
 *
 * When the device is offline these same calls resolve from the local IndexedDB
 * cache instead of failing, so every screen still works.
 */

export const LOG_TYPES = ['diesel', 'urea', 'trip', 'maintenance'];

export const logTypeLabel = (type, t) =>
  ({
    diesel: t('dieselLog'),
    urea: t('ureaLog'),
    trip: t('tripLog'),
    maintenance: t('maintenanceLog'),
  })[type] ?? type;

const mapDocs = (snap) =>
  snap.docs.map((d) => ({ id: d.id, pending: d.metadata.hasPendingWrites, ...d.data() }));

/* ------------------------------------------------------------------ trucks */

export async function fetchTrucks() {
  const snap = await getDocs(query(collection(db, 'trucks'), orderBy('number')));
  return mapDocs(snap);
}

export async function addTruck({ number, plate }) {
  const id = String(number).trim();
  // The truck number is the document id, so Firestore itself rejects duplicates.
  await setDoc(doc(db, 'trucks', id), {
    number: id,
    plate: String(plate ?? '').trim(),
    createdAt: serverTimestamp(),
  });
}

export const deleteTruck = (id) => deleteDoc(doc(db, 'trucks', id));

/* -------------------------------------------------------------------- logs */

/**
 * All four log types share one `logs` collection with a `type` discriminator,
 * which keeps the manager's table and export to a single query.
 *
 * `at` is the device clock, written immediately so an entry can be shown and
 * sorted while it is still queued offline. `serverAt` is the authoritative
 * timestamp and stays null until the write actually reaches Firestore.
 */
export function buildLog({ type, truck, profile, uid, data }) {
  return {
    type,
    truckId: truck?.id ?? null,
    truckNumber: truck?.number ?? null,
    uid,
    userName: profile?.name ?? '',
    userRole: profile?.role ?? '',
    at: Timestamp.fromDate(new Date()),
    serverAt: serverTimestamp(),
    ...data,
  };
}

export const addLog = (entry) => addDoc(collection(db, 'logs'), buildLog(entry));

export async function fetchLogs(max = 1000) {
  const snap = await getDocs(query(collection(db, 'logs'), orderBy('at', 'desc'), limit(max)));
  return mapDocs(snap);
}

/* ---------------------------------------------------------------- payments */

export function buildPayment({ paidTo, amount, note, profile, uid }) {
  return {
    paidTo: String(paidTo).trim(),
    amount,
    note: String(note ?? '').trim(),
    uid,
    userName: profile?.name ?? '',
    at: Timestamp.fromDate(new Date()),
    serverAt: serverTimestamp(),
  };
}

export const addPayment = (payment) => addDoc(collection(db, 'payments'), buildPayment(payment));

export async function fetchPayments(max = 500) {
  const snap = await getDocs(query(collection(db, 'payments'), orderBy('at', 'desc'), limit(max)));
  return mapDocs(snap);
}

/* ----------------------------------------------------------------- helpers */

/** Firestore Timestamp | Date | null -> Date | null */
export function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

export function formatDateTime(value, lang = 'ar') {
  const date = toDate(value);
  if (!date) return '—';
  // Latin digits in both languages: easier to read off a phone at a glance, and
  // it survives the round-trip into Excel.
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/* --------------------------------------------------- last-truck-used memory */

const LAST_TRUCK_KEY = 'ezrm.lastTruck';

export function getLastTruckId(uid) {
  if (typeof window === 'undefined' || !uid) return null;
  return window.localStorage.getItem(`${LAST_TRUCK_KEY}.${uid}`);
}

export function setLastTruckId(uid, truckId) {
  if (typeof window === 'undefined' || !uid || !truckId) return;
  window.localStorage.setItem(`${LAST_TRUCK_KEY}.${uid}`, truckId);
}

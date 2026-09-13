import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
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

/**
 * Which trucks a driver is allowed to pick from. An empty/missing list means
 * "not restricted yet" — callers should fall back to showing every truck, so
 * a driver the manager hasn't gotten around to assigning still works normally.
 */
export async function fetchDriverTruckIds(uid) {
  // Auth may still be restoring when a form mounts; without this guard the
  // undefined uid makes doc() throw and the whole first truck load fails.
  if (!uid) return [];
  const snap = await getDoc(doc(db, 'driverTrucks', uid));
  return snap.exists() ? snap.data().truckIds ?? [] : [];
}

export async function setDriverTrucks(uid, truckIds) {
  await setDoc(doc(db, 'driverTrucks', uid), { truckIds, updatedAt: serverTimestamp() });
}

/* ------------------------------------------------------------------ places */

/*
 * Trip origins/destinations the manager defines once ("المكب", "السوق"…), so
 * drivers pick from a list instead of typing — less friction for them, and one
 * consistent spelling per place in the exports. Works exactly like trucks:
 * the place name is the document id, so duplicates are impossible.
 */

export async function fetchPlaces() {
  const snap = await getDocs(query(collection(db, 'places'), orderBy('name')));
  return mapDocs(snap);
}

export async function addPlace(name) {
  const id = String(name).trim();
  await setDoc(doc(db, 'places', id), { name: id, createdAt: serverTimestamp() });
}

export const deletePlace = (id) => deleteDoc(doc(db, 'places', id));

/* ------------------------------------------------------------- staff names */

/*
 * Accounts log in with short ids (br, re…); the manager attaches each one's
 * real name here. One map document instead of a collection: the whole team
 * costs a single read, and it is cached for the session.
 */

let staffNamesCache = null;

export async function fetchStaffNames(force = false) {
  if (staffNamesCache && !force) return staffNamesCache;
  try {
    const snap = await getDoc(doc(db, 'meta', 'staffNames'));
    staffNamesCache = snap.exists() ? snap.data() : {};
    return staffNamesCache;
  } catch (err) {
    // Not cached: a transient failure should not blank out names all session.
    console.error('[EZRM] could not load staff names', err);
    return {};
  }
}

export async function setStaffName(uid, name) {
  await setDoc(doc(db, 'meta', 'staffNames'), { [uid]: String(name).trim() }, { merge: true });
  staffNamesCache = null;
}

/* -------------------------------------------------------- monthly backups */

/*
 * The Firestore free tier has no automatic backups, so the monthly Excel
 * download IS the backup. This marker records the last month the manager
 * downloaded, and the manager panel nags until the previous month is saved.
 */

export async function fetchBackupMarker() {
  try {
    const snap = await getDoc(doc(db, 'meta', 'backup'));
    return snap.exists() ? snap.data().lastExportedMonth ?? null : null;
  } catch {
    return null;
  }
}

export const setBackupMarker = (monthKey) =>
  setDoc(doc(db, 'meta', 'backup'), { lastExportedMonth: monthKey }, { merge: true });

/** "2026-08" for last month, plus its first/last day, computed from today. */
export function previousMonthRange(now = new Date()) {
  const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const last = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const key = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, '0')}`;
  return { first, last, key };
}

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

/**
 * The document ref is generated locally before the write, so the caller gets
 * the new entry's id synchronously — even offline, where the returned promise
 * will not settle until the queued write reaches the server. The id is what
 * lets the author ask for that entry to be deleted later.
 */
export function addLog(entry) {
  const ref = doc(collection(db, 'logs'));
  return { id: ref.id, promise: setDoc(ref, buildLog(entry)) };
}

/**
 * Logs are fetched by date range, not "the newest N": the manager works one
 * month at a time (view, supervise, download the Excel copy), and range
 * queries keep both the row count and the Firestore reads proportional to the
 * period actually being looked at instead of growing with the app's age.
 */
export async function fetchLogs(fromDate, toDate, max = 5000) {
  const parts = [collection(db, 'logs')];
  if (fromDate) parts.push(where('at', '>=', Timestamp.fromDate(fromDate)));
  if (toDate) parts.push(where('at', '<=', Timestamp.fromDate(toDate)));
  const snap = await getDocs(query(...parts, orderBy('at', 'desc'), limit(max)));
  return mapDocs(snap);
}

/* ------------------------------------------------------- void and deletion */

/*
 * Mistaken entries are VOIDED, not erased: the row stays in the record, marked
 * cancelled, so the history is always complete. The author can void their own
 * entry; the manager can void anything, restore a voided entry, or — manager
 * only — permanently delete one. The Firestore rules enforce the same split.
 */

export const voidLog = (id, uid) =>
  updateDoc(doc(db, 'logs', id), {
    voided: true,
    voidedAt: Timestamp.fromDate(new Date()),
    voidedBy: uid ?? null,
  });

export const restoreLog = (id) => updateDoc(doc(db, 'logs', id), { voided: false });

export const deleteLog = (id) => deleteDoc(doc(db, 'logs', id));

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

/* ------------------------------------------------------ fuel supervision */

/**
 * For each diesel entry, how far the truck went since ITS previous diesel
 * entry and the km-per-litre that implies — the number that makes unusual
 * consumption (or missing diesel) stand out.
 *
 * Odometers are recorded as the last four digits only, so the distance is
 * modulo-10000: 9950 -> 0120 correctly reads as 170 km. That holds as long as
 * a truck doesn't cover 10,000 km between two fill-ups, which these trucks
 * never do. Returns { [entryId]: { km, rate } }; entries without a previous
 * fill inside the loaded period are simply absent.
 */
export function computeConsumption(logs) {
  const lastOdoByTruck = {};
  const result = {};
  const diesel = logs
    .filter((entry) => entry.type === 'diesel' && !entry.voided && entry.truckId)
    .sort((a, b) => (toDate(a.at)?.getTime() ?? 0) - (toDate(b.at)?.getTime() ?? 0));

  for (const entry of diesel) {
    const odo = Number(String(entry.odometer ?? '').trim());
    if (!Number.isFinite(odo)) continue;
    const prev = lastOdoByTruck[entry.truckId];
    if (prev !== undefined) {
      const km = (((odo - prev) % 10000) + 10000) % 10000;
      const liters = typeof entry.liters === 'number' ? entry.liters : Number(entry.liters);
      result[entry.id] = {
        km,
        rate: Number.isFinite(liters) && liters > 0 && km > 0 ? km / liters : null,
      };
    }
    lastOdoByTruck[entry.truckId] = odo;
  }
  return result;
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

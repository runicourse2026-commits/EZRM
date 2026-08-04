# EZRM

Diesel, urea, trip and maintenance logging for a trash-transport truck company.
Replaces the paper exit sheets and the WhatsApp messages.

Arabic-first (RTL) with an English toggle, works with no signal, installable on
Android and iPhone home screens.

- **Next.js 15**, Pages Router, plain CSS — no UI framework, no build plugins.
- **Firebase Auth + Firestore only.** No Cloud Functions, no Storage, no paid
  services. Reads are fetch-on-load, not live listeners, so a 10-person crew
  stays far inside the Spark (free) tier.

---

## 1. Firebase setup (once)

The web config is already baked into `lib/firebase.js`, so there is nothing to
configure at deploy time. Two things still need doing in the console:

### a. Publish the security rules

Firebase Console → **Firestore Database** → **Rules** → paste the contents of
[`firestore.rules`](firestore.rules) → **Publish**.

Without this, Firestore is either wide open or fully locked, depending on how the
database was created.

### b. Create the accounts

Firebase Console → **Authentication** → **Users** → **Add user**.

**The role is taken from the start of the email address.** It must begin with
`driver`, `mechanic` or `manager`. Both of these styles work:

| Person | Email | Password |
| --- | --- | --- |
| Driver | `driver1@dieselapp.com` *or* `driver-ali@dieselapp.com` | their phone number |
| Mechanic | `mechanic1@dieselapp.com` *or* `mechanic-sami@dieselapp.com` | their phone number |
| Manager | `manager@dieselapp.com` | your chosen password |

So a driver called Ali can be either `driver-ali@…` or `driverali@…` — but plain
`ali@dieselapp.com` will **not** work, because nothing in it says "driver".

The accounts already in the project:

| Email | Password | Logs in with |
| --- | --- | --- |
| `driver1@dieselapp.com` | `123456` | ID `driver1` / `123456` |
| `mechanic1@dieselapp.com` | `123456` | ID `mechanic1` / `123456` |
| `manager@dieselapp.com` | `admin123` | ID `manager` / `admin123` |

The crew never sees an email address — they type the **ID** and their **phone
number**. The app tries `<id>@dieselapp.com`, then `driver-<id>@…`, then
`mechanic-<id>@…`, and sends `manager` straight to the manager account.

> Firebase requires passwords of at least 6 characters, so phone numbers must be
> 6 digits or longer.

---

## 2. Run it locally

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:3000.

To check the production build the way Vercel will:

```bash
npm run build
```

---

## 3. Push to GitHub

The repo is already wired to
`https://github.com/runicourse2026-commits/EZRM.git`, so this is the whole
routine:

```bash
git add -A
```

```bash
git commit -m "EZRM diesel tracking app"
```

```bash
git push -u origin main
```

---

## 4. Deploy to Vercel

Easiest path — no CLI:

1. Go to https://vercel.com/new
2. **Import** the GitHub repo you just pushed.
3. Leave every setting at its default (Framework: Next.js, Build: `next build`).
4. **Deploy.**

There are **no environment variables to set**. Every later `git push` redeploys
automatically.

Prefer the CLI?

```bash
npx vercel --prod
```

### One thing to do after the first deploy

Firebase Console → **Authentication** → **Settings** → **Authorized domains** →
**Add domain** → your `*.vercel.app` domain. Login will fail on the live site
until you do.

---

## 5. Install it on a phone

- **Android / Chrome:** open the site → menu (⋮) → *Add to Home screen*.
- **iPhone / Safari:** open the site → Share → *Add to Home Screen*.

It then opens full-screen like a normal app.

---

## How offline works

Firestore keeps a full local copy of the data in IndexedDB.

- Writes are applied locally the instant Save is tapped and replayed to the
  server automatically when the connection returns. There is no sync button and
  nothing for the driver to remember.
- A yellow bar at the top means no internet; the form still saves and says so.
- Reads fall back to the local copy, so every screen still opens.
- **Logging in is the one thing that needs internet.** Once someone has signed in
  on a phone, the session persists and they can keep logging with no signal.

---

## Project layout

```
pages/
  index.js               login (ID + phone/password)
  driver/                menu, diesel, urea, trip
  mechanic/              menu, maintenance
  manager/               menu, logs (filter + CSV), trucks, payments
components/              Layout, form fields, truck picker
lib/
  firebase.js            app init + offline cache
  auth.js                role from email pattern, route guards
  db.js                  all Firestore reads/writes
  i18n.js                Arabic + English strings, RTL switching
  csv.js                 Excel-friendly CSV export
  useSaveLog.js          save that does not hang when offline
public/
  manifest.json, sw.js, icons/
firestore.rules          paste into the Firebase console
scripts/gen-icons.js     regenerates the PWA icons (npm run icons)
```

## Firestore collections

| Collection | Written by | Contents |
| --- | --- | --- |
| `trucks` | manager | truck number (doc id) + plate |
| `logs` | driver, mechanic | all four log types, tagged with `type` |
| `payments` | manager | who was paid, how much, when |

Log entries are append-only: rules block edits and deletes, so the record cannot
be quietly rewritten after the fact.

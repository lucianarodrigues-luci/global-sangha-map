# Global Sangha Map

An interactive world map that visualizes Tergar community activities happening
around the world. It reads events automatically from a public Google Calendar,
determines where each activity takes place, and displays them on a calm,
welcoming map — reinforcing the feeling of a global sangha.

Built as a production-quality MVP, deployed on Netlify with minimal ongoing
maintenance.

**Live:** https://global-sangha-map.netlify.app

---

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **TailwindCSS** (brand palette baked into the theme)
- **Leaflet** + **React Leaflet** + **react-leaflet-cluster**, OpenStreetMap tiles
- **Google Calendar API v3** for event data
- **OpenStreetMap Nominatim** for geocoding (permanently cached as JSON)

No database is required.

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Then fill in the values:

| Variable | Required | Description |
| --- | --- | --- |
| `GOOGLE_CALENDAR_API_KEY` | Recommended | Google Cloud API key with the **Google Calendar API** enabled. Without it, the app falls back to bundled **sample events** so the UI still renders. |
| `GOOGLE_CALENDAR_ID` | Optional | Defaults to the public Tergar community calendar. |
| `NOMINATIM_CONTACT_EMAIL` | Optional | Identifying contact used in the Nominatim `User-Agent` (their usage policy). |

#### Creating a Google Calendar API key

1. Open the [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. **Create credentials → API key**.
3. Enable the **Google Calendar API** for the project.
4. Restrict the key to the Calendar API (recommended).
5. Paste it into `.env.local`.

The target calendar is public, so no OAuth/service account is needed — an API
key is sufficient.

> **Alternative (no API key):** the same calendar is also available as a public
> iCal feed. This project uses the Calendar API because it expands recurring
> events server-side (`singleEvents=true`) and paginates cleanly. To switch to
> iCal you would replace `fetchGoogleCalendarEvents` in `lib/calendar.ts` with an
> `.ics` fetch + parser.

### 3. Run locally

```bash
npm run dev
```

Open http://localhost:3000.

---

## How it works

```
Google Calendar  ──►  lib/calendar.ts   (fetch, 6h cache, recurring expansion)
                          │
                          ▼
                      lib/parser.ts      (location detection, join-link detection,
                          │               online-only classification)
                          ▼
                      lib/geocoder.ts    (Nominatim lookup, ≤1 req/s)
                          │
                          ▼
                      lib/cache.ts       (permanent JSON geocode cache)
                          │
                          ▼
                   app/page.tsx (server) ──► components/HomeClient.tsx (UI)
```

### Location detection (priority order)

1. Google Calendar **Location** field
2. Extracted from the event **title** (e.g. _"Hosted by Tergar Madrid"_,
   _"Tergar São Paulo Practice Group"_, _"Vancouver Community Meditation"_)
3. Extracted from the **description**

Events with no resolvable location are classified `isOnlineOnly = true`, removed
from the map, and shown in the **Online Global Activities** section.

### Join link detection (CTA priority)

1. Zoom URL → 2. Registration URL → 3. Website URL → 4. Email
(label is **Join**, or **Ask to Join** when only an email is available).

### Timezones

Event times are shown in their **original timezone** and in the **visitor's
local timezone** (auto-detected in the browser).

---

## Caching

- **Calendar data** — fetched via Next.js fetch caching and **revalidated every
  6 hours**.
- **Geocoding** — **permanent** cache stored in `data/geocode-cache.json`. The
  same location is never geocoded twice. A seed cache is committed for common
  locations.

> **Netlify note:** the serverless filesystem is read-only except `/tmp`, so
> write-through to the committed cache only persists during local development.
> On Netlify, the committed seed cache is read at runtime (keeping known
> locations free), and newly geocoded locations are cached in `/tmp` for the
> life of the instance. A durable KV/DB-backed cache is the production path and
> is intentionally out of scope for the MVP.

---

## Deploying to Netlify

The site is deployed on Netlify (`global-sangha-map`,
https://global-sangha-map.netlify.app). Build settings live in `netlify.toml`
(uses the official `@netlify/plugin-nextjs` runtime).

1. Connect the repository to the Netlify site (or deploy with the Netlify CLI:
   `netlify deploy --prod`).
2. Add the environment variables from `.env.example` in
   **Site settings → Environment variables** — most importantly
   `GOOGLE_CALENDAR_API_KEY` to switch from sample data to the live calendar.
3. Trigger a deploy. The free tier is sufficient for the MVP.

---

## Demo vs. live data

The data source is controlled **entirely by whether `GOOGLE_CALENDAR_API_KEY`
is set** (see `lib/calendar.ts`) — there is no separate branch or code change:

- **Key set** (in `.env.local` locally, or in the Netlify site environment) →
  loads the real Tergar calendar.
- **Key absent** → falls back to the bundled **sample events**
  (`data/sample-events.json`), which is handy for an offline demo.

So a demo environment just leaves the key unset; production sets it.

---

## Branding

The UI follows the official
[AAM](https://tergar.org/aam-brand-guidelines) and
[Tergar](https://tergar.org/tergar-brand-guidelines) brand guidelines:

- **Logo** — the official Tergar bicolor logo (symbol + wordmark) is used in
  the header, at its original proportions, with clear space, never recolored or
  shadowed (`public/images/tergar-logo.png`).
- **Color palette** — Tergar Blue `#1B4087` (primary actions), Tergar Gold
  `#E39F24` (accent / focus), Space Blue `#424A58` (body text), the brand
  gradient tints, and the neutral base tokens. Map markers: Community → Tergar
  Blue, Special → Tergar Gold, Online → blue tint, Selected → Space Blue.
- **Typography** — Nunito Sans (UI/body) + Source Serif Pro (headings).
- **Style** — rounded corners, soft shadows, generous spacing, gentle fade-in
  animations only.

> **Note:** the original `specs.md` listed a green-based palette that does not
> appear in the official Tergar guidelines. Per the project decision, the UI was
> aligned to the **official Tergar gold/blue palette** so it matches the logo.

---

## Project structure

```
app/            page.tsx, layout.tsx, globals.css
components/     Header, StatisticsBar, DateSelector, OnlineEvents,
                EventSidebar, EventCard, WorldMap, JoinButton, HomeClient
lib/            calendar.ts, parser.ts, geocoder.ts, cache.ts,
                datetime.ts, category.ts
types/          Event.ts
data/           geocode-cache.json, sample-events.json
public/images/  tergar-logo.png (+ horizontal / vertical source variants)
```

---

## Out of scope (future phases)

Authentication, user accounts, event editing/submission, admin dashboard,
database, multi-language UI, and direct `events.tergar.org` integration are
intentionally not implemented in this MVP.

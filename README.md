# Brook — water on autopilot

Smart irrigation control for golf courses, stadiums, factories, rail stations and campuses.
Brook connects to the controller a site already has and decides every night how much water each
zone needs, from the forecast, evaporation, soil moisture, wind, frost, power tariffs and water licences.

This repository is the **sales demo**: a production-grade web app running on simulated live data.

- `/` — landing page with a live slice of the engine, savings calculator and demo request form
- `/app` — the product: overview, sites, site detail with zone map, Autopilot feed, reports, integrations

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start   # production build
```

Deploy: import the repo on [vercel.com/new](https://vercel.com/new) — no settings or environment variables needed.
Optionally set `NEXT_PUBLIC_SITE_URL` to your domain so link previews use it.

## Before you share it

- `src/config/site.ts` — set `contactEmail` to your real inbox (the demo form opens an email to it).
- `src/lib/demo/catalog.ts` — the fictional company, its sites, zones, water prices and climates.

## Demo script (5 minutes)

1. **Landing** → "Open the live demo".
2. **Overview** → water budget shown like a balance, savings, what Autopilot reads right now.
3. Press **Inspect** on the leak alert → flow curve → **Close valve & send crew**.
4. **Review plan** → Pine Valley: tap zones, read *Why Autopilot planned it this way*, **Approve plan**.
5. **Stade du Littoral** runs on manual → **Turn on Autopilot** and watch tonight’s water drop.
6. **Reports** → licence-cap compliance, CSV export, save as PDF.
7. Press **⌘K / Ctrl+K** anywhere to jump to a site, a zone ("G7") or run an action.

Everything resets with **Reset** in the demo banner.

## How the demo works

All data is generated in the browser for the visitor's date, so the demo never looks stale and
every visitor sees the same numbers on the same day.

| File | What it does |
| --- | --- |
| `src/lib/demo/weather.ts` | Daily weather from monthly climate normals; ET₀ by Hargreaves with FAO-56 solar geometry; real daylight hours |
| `src/lib/demo/engine.ts` | **Autopilot**: decides each zone (water / skip / hold) with a reason — leak, frost, rain, soil moisture, ET, wind — then builds tonight's schedule around the off-peak window |
| `src/lib/demo/generate.ts` | Sites, zones, sensor readings, 90 days of usage vs the old fixed schedule, budgets, alerts |
| `src/lib/demo/store.tsx` | Live state: ticking flow, new events every ~20 s, actions (approve, rain delay, pause, fix leak) |
| `src/views/*` | The app screens |

Stack: Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, lucide icons. No backend.

## From demo to product

The engine is already a pure function (`planFor(site, options)`), so the path is mostly plumbing:

1. **Accounts & tenants** — auth, organisations, roles (owner, superintendent, viewer).
2. **Database** — Postgres for sites, zones, readings (time-series table), plans and the audit log.
3. **Weather** — swap the generator for a forecast API with ET₀ (e.g. Open-Meteo) per site.
4. **Controller adapters** — one adapter per brand (vendor APIs where available, Modbus/BACnet gateways,
   Brook Edge relay box for the rest). Start read-only; add write permissions per site.
5. **Nightly job** — run `planFor` per site before the window, store the plan, push for approval, send to the controller.
6. **Alerts** — flow anomaly detection per lateral, push notifications, crew tickets.

import { SITE_SEEDS } from "./catalog";
import { FIXED_SEASON, PRECISION, etRatio, isWinterised } from "./engine";
import { clamp, round1, rngFor } from "./rng";
import { TODAY_INDEX, addDays, dayKey, startOfDay, weatherSeries } from "./weather";
import type { Alert, DailyUsage, Site, Zone } from "./types";

export interface DemoWorld {
  now: Date;
  today: Date;
  sites: Site[];
  alerts: Alert[];
}

/** Build the whole demo world for "now". Same day → same numbers, for every viewer. */
export function buildWorld(now: Date): DemoWorld {
  const today = startOfDay(now);
  const sites: Site[] = SITE_SEEDS.map((seed) => {
    const weather = weatherSeries(seed.id, seed.lat, seed.climate, today);

    // Pine Valley's story for the demo: a front brings rain overnight.
    if (seed.id === "pine-valley") {
      weather[TODAY_INDEX] = { ...weather[TODAY_INDEX], rainMm: 0, rainProb: 0.1 };
      weather[TODAY_INDEX + 1] = { ...weather[TODAY_INDEX + 1], rainMm: 6, rainProb: 0.72, humidity: Math.max(weather[TODAY_INDEX + 1].humidity, 84) };
    }

    const site: Site = {
      id: seed.id,
      name: seed.name,
      city: seed.city,
      country: seed.country,
      lat: seed.lat,
      tz: seed.tz,
      type: seed.type,
      typeLabel: seed.typeLabel,
      controller: seed.controller,
      waterSource: seed.waterSource,
      pricePerM3: seed.pricePerM3,
      dailyCapM3: seed.dailyCapM3,
      autopilot: seed.autopilot,
      coldClimate: seed.coldClimate,
      zones: [],
      weather,
      usage: [],
      monthBudgetM3: 0,
    };

    const recentRain = weather[TODAY_INDEX - 1].rainMm + weather[TODAY_INDEX - 2].rainMm * 0.5;
    const winter = isWinterised(site, today);
    const zones: Zone[] = [];
    for (const [kind, count] of seed.zones) {
      for (let n = 1; n <= count; n++) {
        const id = `${kind.prefix}${n}`;
        const r = rngFor(seed.id, id, dayKey(today));
        const [lo, hi] = kind.band;
        const wet = Math.min(6, recentRain * 0.5) + (winter ? 5 : 0);
        const vwc = Math.round(clamp(lo - 2.5 + r() * (hi - lo + 5) + wet, 8, 42));
        const history: number[] = [vwc];
        for (let i = 0; i < 6; i++) history.unshift(Math.round(clamp(history[0] + (r() - 0.45) * 4, 8, 42)));
        zones.push({
          id,
          siteId: seed.id,
          kind,
          n,
          vwc,
          ec: round1(0.7 + r() * 0.7 + (seed.waterSource.startsWith("Reclaimed") ? 0.4 : 0)),
          soilTemp: Math.round((weather[TODAY_INDEX].tMin + weather[TODAY_INDEX].tMax) / 2 - 2 + r() * 2),
          history,
        });
      }
    }
    if (seed.id === "pine-valley") {
      const f14 = zones.find((z) => z.id === "F14");
      if (f14) f14.leak = { overPct: 38, since: "20:47" };
    }
    site.zones = zones;

    // Usage history: what the old timer would have used vs what actually ran.
    const fullTotal = zones.reduce((a, z) => a + z.kind.fullM3, 0);
    const usage: DailyUsage[] = [];
    for (let i = 0; i <= TODAY_INDEX; i++) {
      const w = weather[i];
      const r = rngFor(seed.id, "use", dayKey(w.date));
      const off = isWinterised(site, w.date);
      const nominal = off ? 0 : fullTotal * FIXED_SEASON[w.date.getMonth()];
      const fixed = nominal * (w.rainMm > 15 ? 0 : 1); // even timers get switched off for a storm
      let used: number;
      if (off) used = 0;
      else if (!seed.autopilot) used = fixed * (0.97 + r() * 0.06);
      else {
        const rain = Math.max(0, 1 - w.rainMm / 8);
        used = nominal * etRatio(w.et0, w.et0Normal) * PRECISION * rain * (0.95 + r() * 0.1);
      }
      usage.push({ date: w.date, used: Math.round(used), fixed: Math.round(fixed), rainMm: w.rainMm });
    }
    site.usage = usage;

    // Budget: 92% of what the old schedule would use this month.
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    let monthFixed = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(today.getFullYear(), today.getMonth(), d);
      if (isWinterised(site, date)) continue;
      monthFixed += fullTotal * FIXED_SEASON[date.getMonth()];
    }
    site.monthBudgetM3 = Math.round((monthFixed * 0.92) / 10) * 10;
    return site;
  });

  const at = (minsAgo: number) => new Date(now.getTime() - minsAgo * 60_000);
  const alerts: Alert[] = [
    {
      id: "leak-pv-f14",
      siteId: "pine-valley",
      zoneId: "F14",
      title: "Possible leak · fairway F14",
      body: "Flow on the F14 lateral is 38% above its normal curve with the valve closed. Autopilot held the zone and will re-test at 06:00.",
      severity: "high",
      status: "open",
      at: at(42),
    },
    {
      id: "probe-lis-r5",
      siteId: "lisboa-oriente",
      zoneId: "R5",
      title: "Soil probe offline · roof R5",
      body: "No reading for 3 hours. Battery last reported 4%. R5 is following its neighbours R4 and R6 until it comes back.",
      severity: "medium",
      status: "open",
      at: at(190),
    },
  ];

  return { now, today, sites, alerts };
}

export function monthToDate(site: Site, today: Date) {
  return site.usage
    .filter((u) => u.date.getMonth() === today.getMonth() && u.date.getFullYear() === today.getFullYear())
    .reduce(
      (a, u) => ({ used: a.used + u.used, fixed: a.fixed + u.fixed }),
      { used: 0, fixed: 0 },
    );
}

export function lastNDays(sites: Site[], n: number) {
  const len = sites[0].usage.length;
  const out: { date: Date; used: number; fixed: number; rainy: boolean }[] = [];
  for (let i = len - n; i < len; i++) {
    let used = 0,
      fixed = 0,
      rain = 0;
    for (const s of sites) {
      used += s.usage[i].used;
      fixed += s.usage[i].fixed;
      rain += s.usage[i].rainMm;
    }
    out.push({ date: sites[0].usage[i].date, used, fixed, rainy: rain / sites.length > 2 });
  }
  return out;
}

export { addDays };

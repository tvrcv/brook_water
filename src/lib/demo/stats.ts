import { monthToDate } from "./generate";
import { TODAY_INDEX } from "./weather";
import type { Plan, Site } from "./types";

export function orgStats(sites: Site[], plans: Record<string, Plan>, today: Date) {
  let budget = 0,
    used = 0,
    fixed = 0,
    savedEur = 0;
  for (const s of sites) {
    const m = monthToDate(s, today);
    budget += s.monthBudgetM3;
    used += m.used;
    fixed += m.fixed;
    savedEur += Math.max(0, m.fixed - m.used) * s.pricePerM3;
  }
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const day = today.getDate();
  const expected = budget * (day / daysInMonth);
  const tonightPlanned = sites.reduce((a, s) => a + plans[s.id].plannedM3, 0);
  const tonightFixed = sites.reduce((a, s) => a + plans[s.id].fixedM3, 0);
  const watering = sites.reduce((a, s) => a + plans[s.id].watering, 0);
  const zones = sites.reduce((a, s) => a + s.zones.length, 0);
  const savingsSeries = Array.from({ length: 20 }, (_, i) => {
    const idx = TODAY_INDEX - 19 + i;
    return sites.reduce((a, s) => a + Math.max(0, s.usage[idx].fixed - s.usage[idx].used), 0);
  });
  return {
    budget,
    used,
    left: Math.max(0, budget - used),
    fixed,
    saved: Math.max(0, fixed - used),
    savedPct: fixed > 0 ? (fixed - used) / fixed : 0,
    savedEur,
    onPace: used <= expected,
    paceDelta: expected > 0 ? (expected - used) / expected : 0,
    daysLeft: daysInMonth - day,
    usedPct: budget > 0 ? used / budget : 0,
    tonightPlanned,
    tonightFixed,
    watering,
    zones,
    savingsSeries,
  };
}

export function siteMonth(site: Site, today: Date) {
  const m = monthToDate(site, today);
  return {
    ...m,
    saved: Math.max(0, m.fixed - m.used),
    budgetPct: site.monthBudgetM3 > 0 ? m.used / site.monthBudgetM3 : 0,
  };
}

/** Average of a site's soil probes right now. */
export const avgMoisture = (s: Site) => Math.round(s.zones.reduce((a, z) => a + z.vwc, 0) / s.zones.length);

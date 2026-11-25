import { clamp, round1 } from "./rng";
import { TODAY_INDEX } from "./weather";
import type { Plan, PlanStep, ReasonKey, ReasonTotal, Site, ZoneDecision } from "./types";

/** The old timer program most sites start from, as a share of a full run, Jan..Dec. */
export const FIXED_SEASON = [0.5, 0.55, 0.65, 0.8, 0.95, 1.1, 1.15, 1.15, 1, 0.8, 0.6, 0.5];

/** Share of the old timer a well-tuned, sensor-led schedule needs on an average day. */
export const PRECISION = 0.82;

/** How today's evaporation compares with a normal day for the date. */
export const etRatio = (et0: number, et0Normal: number) => clamp(et0 / et0Normal, 0.6, 1.3);

export function isWinterised(site: Site, d: Date) {
  const m = d.getMonth();
  return site.coldClimate && (m >= 10 || m <= 2);
}

export interface PlanOptions {
  paused?: boolean;
  rainDelay?: boolean;
  resolvedLeaks?: Set<string>;
  forceAutopilot?: boolean;
}

/**
 * Decide tonight's run, zone by zone. Every skip or trim carries the reason,
 * so the dashboard can explain the plan in plain words.
 */
export function planFor(site: Site, opts: PlanOptions = {}): Plan {
  const today = site.weather[TODAY_INDEX];
  const tomorrow = site.weather[TODAY_INDEX + 1];
  const month = today.date.getMonth();
  const winter = isWinterised(site, today.date);
  const season = winter ? 0 : FIXED_SEASON[month];
  const rainEff = tomorrow.rainMm * tomorrow.rainProb;
  const etFactor = season * etRatio(today.et0, today.et0Normal) * PRECISION;
  const frost = tomorrow.tMin <= 1;
  const windy = today.wind >= 25;

  const autopilotDecisions: ZoneDecision[] = site.zones.map((zone) => {
    const k = zone.kind;
    const fixedM3 = round1(k.fullM3 * season);
    const base = { zone, fixedM3 };
    const skip = (reason: ReasonKey, note: string, action: "skip" | "hold" = "skip"): ZoneDecision => ({
      ...base,
      action,
      plannedM3: 0,
      minutes: 0,
      reason,
      note,
    });

    if (winter) return skip("winter", "Winter mode · lines drained");
    if (opts.paused) return skip("paused", "Paused by you");
    if (zone.leak && !opts.resolvedLeaks?.has(zone.id))
      return skip("leak", `Flow ${zone.leak.overPct}% over normal · held`, "hold");
      if (opts.rainDelay) return skip("rain", "Rain delay set by you");
    if (frost && k.spray) return skip("frost", `${tomorrow.tMin} °C forecast · waits until 10:00`);
    if (rainEff >= k.rainSkipMm) return skip("rain", `${tomorrow.rainMm} mm rain forecast`);
    if (zone.vwc >= k.band[1]) return skip("moist", `Soil at ${zone.vwc}% · already in band`);

    let factor = etFactor;
    let reason: ReasonKey = "et";
    let note = `Matched to ET ${today.et0} mm`;
    if (zone.vwc < k.band[0]) {
      factor *= 1.25;
      reason = "dry";
      note = `Soil at ${zone.vwc}% · topped up`;
    } else if (zone.vwc >= (k.band[0] + k.band[1]) / 2) {
      factor *= 0.85;
    }
    if (k.windSensitive && today.wind > 15) {
      factor *= 1 + (today.wind - 15) / 40;
      reason = "wind";
      note = `Wind ${today.wind} km/h · dust control raised`;
    }
    const plannedM3 = round1(k.fullM3 * factor);
    if (reason === "et" && plannedM3 > fixedM3) {
      reason = "dry";
      note = `High ET ${today.et0} mm · more than the old timer`;
    }
    return {
      ...base,
      action: "water",
      plannedM3,
      minutes: Math.max(1, Math.round(k.minutes * factor)),
      reason,
      note,
    };
  });

  const potentialM3 = round1(sum(autopilotDecisions.map((d) => d.plannedM3)));
  const manual = !site.autopilot && !opts.forceAutopilot && !winter;

  const decisions: ZoneDecision[] = manual
    ? site.zones.map((zone) => {
        const fixedM3 = round1(zone.kind.fullM3 * season);
        return {
          zone,
          fixedM3,
          action: "water",
          plannedM3: fixedM3,
          minutes: Math.round(zone.kind.minutes * season),
          reason: null,
          note: "Fixed schedule",
        };
      })
    : autopilotDecisions;

  const plannedM3 = round1(sum(decisions.map((d) => d.plannedM3)));
  const fixedM3 = round1(sum(decisions.map((d) => d.fixedM3)));
  const watering = decisions.filter((d) => d.action === "water").length;

  const reasons = manual ? [] : reasonTotals(decisions, site);
  const { steps, start, end } = schedule(site, decisions, !winter && tomorrow.rainProb >= 0.5 && tomorrow.rainMm > 0 ? tomorrow.rainMm : 0);

  const notes: string[] = [];
  if (winter) notes.push("Lines drained for winter. Brook keeps watching frost, leaks and the rain tank.");
  if (windy && !winter) notes.push(`Wind ${today.wind} km/h → spray zones start after 22:00, when it drops`);
  if (!winter && !manual && watering > 0) notes.push("Off-peak power from 22:00 → pumps scheduled to match");
  if (frost && !winter) notes.push(`Frost risk (${tomorrow.tMin} °C) → spray zones wait until mid-morning`);

  const mode: Plan["mode"] = winter
    ? "winter"
    : opts.paused
      ? "paused"
      : opts.rainDelay
        ? "rain-delay"
        : manual
          ? "manual"
          : "autopilot";

  return {
    siteId: site.id,
    decisions,
    plannedM3,
    fixedM3,
    watering,
    skipped: decisions.length - watering,
    reasons,
    steps,
    windowStart: start,
    windowEnd: end,
    notes,
    costSaved: round1(Math.max(0, fixedM3 - plannedM3) * site.pricePerM3),
    autopilot: !manual,
    potentialM3,
    mode,
    rainTonight: { mm: tomorrow.rainMm, prob: tomorrow.rainProb },
  };
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

function reasonTotals(decisions: ZoneDecision[], site: Site): ReasonTotal[] {
  const today = site.weather[TODAY_INDEX];
  const tomorrow = site.weather[TODAY_INDEX + 1];
  const by = new Map<ReasonKey, ZoneDecision[]>();
  for (const d of decisions) {
    if (!d.reason) continue;
    by.set(d.reason, [...(by.get(d.reason) ?? []), d]);
  }
  const out: ReasonTotal[] = [];
  for (const [key, ds] of by) {
    const m3 = round1(sum(ds.map((d) => d.fixedM3 - d.plannedM3)));
    const n = ds.length;
    const z = n === 1 ? "zone" : "zones";
    const text: Record<ReasonKey, [string, string]> = {
      rain: [
        "Rain on the way",
        `${tomorrow.rainMm} mm forecast, ${Math.round(tomorrow.rainProb * 100)}% chance · ${n} ${z} skipped`,
      ],
      moist: ["Soil already moist", `${n} ${z} at or above target band`],
      et: [
        today.et0 < 3 ? "Low evaporation" : "Matched to evaporation",
        `ET ${today.et0} mm · run-times trimmed on ${n} ${z}`,
      ],
      dry: ["Dry spots topped up", `${n} ${z} below target or running hot`],
      leak: ["Possible leak", `${ds.map((d) => d.zone.id).join(", ")} held until flow check`],
      frost: ["Frost guard", `${tomorrow.tMin} °C forecast · ${n} spray ${z} wait`],
      wind: ["Windy yard", `Dust suppression raised for ${today.wind} km/h wind`],
      restriction: ["Water restriction", `${n} ${z} paused by local rules`],
      paused: ["Paused by you", `${n} ${z} won’t run tonight`],
      winter: ["Winter mode", "System drained until spring"],
    };
    if (Math.abs(m3) < 0.05) continue;
    out.push({ key, label: text[key][0], why: text[key][1], m3 });
  }
  return out.sort((a, b) => b.m3 - a.m3);
}

function hhmm(mins: number) {
  const m = ((Math.round(mins) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function schedule(site: Site, decisions: ZoneDecision[], rainMm: number) {
  const parallel = site.type === "golf" ? 6 : 3;
  const groups = new Map<string, ZoneDecision[]>();
  for (const d of decisions) {
    if (d.action !== "water") continue;
    const key = d.zone.kind.key;
    groups.set(key, [...(groups.get(key) ?? []), d]);
  }
  const ordered = [...groups.values()].sort((a, b) => a[0].zone.kind.priority - b[0].zone.kind.priority);
  const totalMin = sum(ordered.map((g) => Math.ceil(sum(g.map((d) => d.minutes)) / parallel) + 5));
  let t = totalMin > 300 ? 21 * 60 + 20 : 22 * 60; // start at 22:00 off-peak unless the night is long
  const start = hhmm(t);
  const steps: PlanStep[] = [];
  let offPeakShown = false;
  for (const g of ordered) {
    if (!offPeakShown && t >= 22 * 60) {
      steps.push({ time: "22:00", title: "Pumps on off-peak power", sub: "Cheapest electricity window of the day", m3: null, tone: "info" });
      offPeakShown = true;
    }
    const k = g[0].zone.kind;
    const all = decisions.filter((d) => d.zone.kind.key === k.key).length;
    const skipped = all - g.length;
    const m3 = round1(sum(g.map((d) => d.plannedM3)));
    const avg = Math.round(sum(g.map((d) => d.minutes)) / g.length);
    steps.push({
      time: hhmm(t),
      title: k.plural,
      sub: `${g.length} ${g.length === 1 ? "zone" : "zones"} · ~${avg} min each${skipped ? ` · ${skipped} skipped` : ""}`,
      m3,
      tone: "water",
    });
    t += Math.ceil(sum(g.map((d) => d.minutes)) / parallel) + 5;
  }
  if (!offPeakShown && ordered.length) {
    steps.splice(0, 0, { time: "22:00", title: "Pumps on off-peak power", sub: "Cheapest electricity window of the day", m3: null, tone: "info" });
  }
  const end = ordered.length ? hhmm(t) : start;
  if (rainMm > 0) {
    steps.push({ time: t > 27 * 60 ? hhmm(t + 30) : "03:00", title: "Rain expected", sub: `${rainMm} mm · Autopilot re-checks at 07:00`, m3: null, tone: "muted" });
  }
  return { steps, start, end };
}

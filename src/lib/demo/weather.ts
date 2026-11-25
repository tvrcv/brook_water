import type { Climate } from "./catalog";
import type { DayWeather } from "./types";
import { clamp, rngFor, round1 } from "./rng";

const DAY = 86_400_000;

export function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number) {
  return new Date(d.getTime() + n * DAY);
}

function dayOfYear(d: Date) {
  const start = Date.UTC(d.getFullYear(), 0, 0);
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - start) / DAY);
}

/** FAO-56 extraterrestrial radiation (MJ/m²/day) and daylight hours. */
export function solarGeometry(latDeg: number, d: Date) {
  const J = dayOfYear(d);
  const phi = (latDeg * Math.PI) / 180;
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI * J) / 365);
  const delta = 0.409 * Math.sin((2 * Math.PI * J) / 365 - 1.39);
  const ws = Math.acos(clamp(-Math.tan(phi) * Math.tan(delta), -1, 1));
  const Ra =
    ((24 * 60) / Math.PI) *
    0.082 *
    dr *
    (ws * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(ws));
  const daylightH = (24 / Math.PI) * ws;
  return { Ra, daylightH };
}

/** Linear interpolation of a monthly normal to a given day. */
function monthly(values: number[], d: Date) {
  const m = d.getMonth();
  const dim = new Date(d.getFullYear(), m + 1, 0).getDate();
  const pos = (d.getDate() - 0.5) / dim - 0.5; // -0.5..0.5 around mid-month
  const other = pos >= 0 ? (m + 1) % 12 : (m + 11) % 12;
  const w = Math.abs(pos);
  return values[m] * (1 - w) + values[other] * w;
}

export function dayWeather(siteId: string, lat: number, c: Climate, d: Date): DayWeather {
  const r = rngFor(siteId, "wx", dayKey(d));
  const tMean = monthly(c.tMean, d) + (r() - 0.5) * 5;
  const pRain = monthly(c.rainProb, d);
  const rains = r() < pRain;
  const rainMm = rains ? round1(monthly(c.rainMm, d) * (0.3 + r() * 1.4)) : 0;
  const range = rains ? 4 + r() * 3 : 8 + r() * 4;
  const tMin = round1(tMean - range / 2);
  const tMax = round1(tMean + range / 2);
  const humidity = Math.round(clamp(monthly(c.humidity, d) + (rains ? 12 : 0) + (r() - 0.5) * 12, 30, 98));
  const wind = Math.round(clamp(c.wind * (0.5 + r()), 3, 45));
  const { Ra, daylightH } = solarGeometry(lat, d);
  const cloud = rains ? 0.55 : 0.9 + r() * 0.1;
  const et0 = round1(Math.max(0.2, 0.0023 * 0.408 * Ra * (tMean + 17.8) * Math.sqrt(Math.max(1, tMax - tMin)) * cloud));
  const solar = round1(Ra * (0.25 + 0.5 * cloud) * 0.75);
  const tNorm = monthly(c.tMean, d);
  const et0Normal = round1(Math.max(0.3, 0.0023 * 0.408 * Ra * (tNorm + 17.8) * Math.sqrt(10) * 0.85));
  // A forecast carries uncertainty: a dry day can still show a small chance.
  const rainProb = rains ? round1(0.55 + r() * 0.4) : round1(r() * 0.2);
  return { date: d, tMin, tMax, humidity, wind, rainMm, rainProb, et0, et0Normal, daylightH, solar };
}

/** 90 days of history, today, and a 7-day forecast. */
export function weatherSeries(siteId: string, lat: number, c: Climate, today: Date) {
  const out: DayWeather[] = [];
  for (let i = -90; i <= 7; i++) out.push(dayWeather(siteId, lat, c, addDays(today, i)));
  return out;
}

export const TODAY_INDEX = 90;

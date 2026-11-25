const intFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const oneFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

export const fmt = (n: number) => intFmt.format(Math.round(n));
export const fmt1 = (n: number) => oneFmt.format(n);

/** Small volumes keep a decimal, big ones don't. */
export const m3 = (n: number) => `${Math.abs(n) < 100 ? fmt1(n) : fmt(n)} m³`;

export const eur = (n: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: Math.abs(n) < 100 ? 2 : 0,
  }).format(n);

export const pct = (n: number) => `${Math.round(n * 100)}%`;

export function timeIn(tz: string, d: Date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(d);
}

export function hourIn(tz: string, d: Date) {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hour12: false }).format(d)) % 24;
}

export const clock = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(d);

export const shortDate = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(d);

export const weekday = (d: Date) => new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(d);

export const longDate = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(d);

export function ago(from: Date, now: Date) {
  const s = Math.max(0, Math.round((now.getTime() - from.getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

export function greeting(d: Date) {
  const h = d.getHours();
  return h < 5 ? "Good evening" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export const flag: Record<string, string> = { ES: "Spain", PT: "Portugal", FR: "France", PL: "Poland" };

export type SiteType =
  | "golf"
  | "rail"
  | "factory"
  | "stadium"
  | "campus";

export type ControllerBrand =
  | "Rain Bird CirrusPRO"
  | "Toro Lynx"
  | "Hunter ACC2"
  | "Modbus gateway"
  | "Brook Edge";

/** Agronomic profile of a zone kind. Drives every Autopilot decision. */
export interface ZoneKind {
  key: string;
  label: string; // e.g. "Green"
  plural: string; // e.g. "Greens"
  prefix: string; // e.g. "G"
  /** crop coefficient — share of reference ET this planting actually uses */
  kc: number;
  /** target volumetric water content band, % */
  band: [number, number];
  /** forecast rain (mm × probability) at which tonight's run is skipped */
  rainSkipMm: number;
  /** m³ a full run uses on the old fixed schedule */
  fullM3: number;
  /** minutes a full run takes */
  minutes: number;
  /** sprinkler (true) vs drip / subsurface (false) — wind & frost only affect spray */
  spray: boolean;
  /** order in tonight's queue — lower runs first */
  priority: number;
  /** some uses rise with wind (dust suppression) */
  windSensitive?: boolean;
}

export interface Zone {
  id: string; // "G7"
  siteId: string;
  kind: ZoneKind;
  n: number;
  vwc: number; // soil moisture now, %
  ec: number; // salinity dS/m
  soilTemp: number; // °C
  history: number[]; // last 7 days of moisture, oldest first
  leak?: { overPct: number; since: string };
}

export interface DayWeather {
  date: Date;
  tMin: number;
  tMax: number;
  humidity: number; // %
  wind: number; // km/h
  rainMm: number;
  rainProb: number; // 0..1
  et0: number; // mm reference evapotranspiration
  et0Normal: number; // climatological ET0 for this date
  daylightH: number;
  solar: number; // MJ/m²
}

export interface Site {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  tz: string;
  type: SiteType;
  typeLabel: string;
  controller: ControllerBrand;
  waterSource: string;
  pricePerM3: number; // € demo tariff
  dailyCapM3?: number; // licence or contract cap
  autopilot: boolean;
  zones: Zone[];
  weather: DayWeather[]; // index 0..89 = history (oldest→yesterday), 90 = today, 91..97 = forecast
  usage: DailyUsage[]; // 90 days history, oldest first
  monthBudgetM3: number;
  coldClimate: boolean;
}

export interface DailyUsage {
  date: Date;
  used: number;
  fixed: number; // what the old fixed schedule would have used
  rainMm: number;
}

export type ReasonKey =
  | "rain"
  | "moist"
  | "et"
  | "leak"
  | "frost"
  | "restriction"
  | "dry"
  | "wind"
  | "paused"
  | "winter";

export interface ZoneDecision {
  zone: Zone;
  action: "water" | "skip" | "hold";
  plannedM3: number;
  fixedM3: number;
  minutes: number;
  reason: ReasonKey | null;
  note: string;
}

export interface PlanStep {
  time: string;
  title: string;
  sub: string;
  m3: number | null;
  tone: "water" | "info" | "muted";
}

export interface ReasonTotal {
  key: ReasonKey;
  label: string;
  why: string;
  m3: number; // positive = water removed; negative = water added
}

export interface Plan {
  siteId: string;
  decisions: ZoneDecision[];
  plannedM3: number;
  fixedM3: number;
  watering: number;
  skipped: number;
  reasons: ReasonTotal[];
  steps: PlanStep[];
  windowStart: string;
  windowEnd: string;
  notes: string[];
  costSaved: number;
  /** false = site runs its fixed schedule; potentialM3 is what Autopilot would have used */
  autopilot: boolean;
  potentialM3: number;
  mode: "autopilot" | "manual" | "paused" | "rain-delay" | "winter";
  rainTonight: { mm: number; prob: number };
}

export type FeedTone = "good" | "alert" | "info";

export interface FeedEvent {
  id: string;
  at: Date;
  siteId: string;
  title: string;
  why: string;
  amount: string;
  tone: FeedTone;
  icon: "rain" | "alert" | "bolt" | "drop" | "calendar" | "frost" | "wind" | "check" | "sensor";
}

export interface Alert {
  id: string;
  siteId: string;
  zoneId?: string;
  title: string;
  body: string;
  severity: "high" | "medium";
  status: "open" | "resolved";
  at: Date;
}

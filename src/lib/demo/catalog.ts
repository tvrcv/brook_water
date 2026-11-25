import type { ControllerBrand, SiteType, ZoneKind } from "./types";

const kind = (k: ZoneKind) => k;

/** Zone kinds per type of site. Numbers are agronomic rules of thumb, tuned for a believable demo. */
export const ZONE_KINDS = {
  green: kind({ key: "green", label: "Green", plural: "Greens", prefix: "G", kc: 0.85, band: [22, 28], rainSkipMm: 8, fullM3: 4, minutes: 6, spray: true, priority: 1 }),
  tee: kind({ key: "tee", label: "Tee", plural: "Tees", prefix: "T", kc: 0.8, band: [22, 28], rainSkipMm: 5, fullM3: 5, minutes: 8, spray: true, priority: 2 }),
  fairway: kind({ key: "fairway", label: "Fairway", plural: "Fairways", prefix: "F", kc: 0.75, band: [20, 28], rainSkipMm: 3, fullM3: 30, minutes: 12, spray: true, priority: 3 }),
  surround: kind({ key: "surround", label: "Surround", plural: "Surrounds", prefix: "S", kc: 0.7, band: [20, 28], rainSkipMm: 4, fullM3: 12, minutes: 10, spray: true, priority: 4 }),

  roof: kind({ key: "roof", label: "Green roof", plural: "Green roofs", prefix: "R", kc: 0.45, band: [16, 26], rainSkipMm: 2, fullM3: 1.6, minutes: 15, spray: false, priority: 2 }),
  planter: kind({ key: "planter", label: "Planter", plural: "Platform planters", prefix: "P", kc: 0.6, band: [20, 30], rainSkipMm: 3, fullM3: 0.5, minutes: 10, spray: false, priority: 1 }),
  forecourt: kind({ key: "forecourt", label: "Lawn", plural: "Forecourt lawns", prefix: "L", kc: 0.8, band: [20, 28], rainSkipMm: 3, fullM3: 5, minutes: 12, spray: true, priority: 3 }),

  perimeter: kind({ key: "perimeter", label: "Lawn", plural: "Perimeter lawns", prefix: "L", kc: 0.75, band: [20, 28], rainSkipMm: 3, fullM3: 6, minutes: 12, spray: true, priority: 2 }),
  shrub: kind({ key: "shrub", label: "Bed", plural: "Shrub beds", prefix: "B", kc: 0.5, band: [18, 28], rainSkipMm: 4, fullM3: 1.2, minutes: 20, spray: false, priority: 1 }),
  dust: kind({ key: "dust", label: "Yard", plural: "Dust suppression", prefix: "D", kc: 1, band: [8, 30], rainSkipMm: 2, fullM3: 4, minutes: 6, spray: true, priority: 3, windSensitive: true }),

  pitch: kind({ key: "pitch", label: "Pitch", plural: "Pitch", prefix: "P", kc: 0.85, band: [22, 30], rainSkipMm: 6, fullM3: 9, minutes: 10, spray: true, priority: 1 }),
  stadiumSurround: kind({ key: "stadiumSurround", label: "Surround", plural: "Surrounds", prefix: "S", kc: 0.7, band: [20, 28], rainSkipMm: 4, fullM3: 3, minutes: 10, spray: true, priority: 2 }),

  lawn: kind({ key: "lawn", label: "Lawn", plural: "Lawns", prefix: "L", kc: 0.8, band: [20, 28], rainSkipMm: 3, fullM3: 4, minutes: 12, spray: true, priority: 2 }),
  bed: kind({ key: "bed", label: "Bed", plural: "Planting beds", prefix: "B", kc: 0.5, band: [18, 28], rainSkipMm: 4, fullM3: 0.8, minutes: 20, spray: false, priority: 1 }),
  roofGarden: kind({ key: "roofGarden", label: "Roof garden", plural: "Roof garden", prefix: "R", kc: 0.55, band: [16, 26], rainSkipMm: 2, fullM3: 1.2, minutes: 15, spray: false, priority: 3 }),
} satisfies Record<string, ZoneKind>;

export interface Climate {
  /** monthly mean temperature °C, Jan..Dec */
  tMean: number[];
  /** daily chance of rain per month */
  rainProb: number[];
  /** mean mm on a rainy day per month */
  rainMm: number[];
  /** mean relative humidity per month */
  humidity: number[];
  /** typical wind km/h */
  wind: number;
}

export interface SiteSeed {
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
  pricePerM3: number;
  dailyCapM3?: number;
  autopilot: boolean;
  coldClimate: boolean;
  zones: [ZoneKind, number][];
  climate: Climate;
}

const MED_HUM = [75, 73, 70, 67, 65, 63, 62, 64, 67, 72, 75, 76];

export const SITE_SEEDS: SiteSeed[] = [
  {
    id: "pine-valley",
    name: "Pine Valley Golf Club",
    city: "Sotogrande",
    country: "ES",
    lat: 36.29,
    tz: "Europe/Madrid",
    type: "golf",
    typeLabel: "Golf course",
    controller: "Rain Bird CirrusPRO",
    waterSource: "Reclaimed water + lake",
    pricePerM3: 0.85,
    dailyCapM3: 1200,
    autopilot: true,
    coldClimate: false,
    zones: [
      [ZONE_KINDS.green, 18],
      [ZONE_KINDS.tee, 18],
      [ZONE_KINDS.fairway, 18],
      [ZONE_KINDS.surround, 10],
    ],
    climate: {
      tMean: [12.5, 13, 14.5, 16, 19, 22, 25, 25.5, 23, 19.5, 15.5, 13.5],
      rainProb: [0.2, 0.18, 0.17, 0.15, 0.1, 0.03, 0.01, 0.02, 0.07, 0.15, 0.2, 0.22],
      rainMm: [12, 11, 9, 8, 6, 4, 2, 3, 8, 11, 13, 14],
      humidity: MED_HUM,
      wind: 16,
    },
  },
  {
    id: "lisboa-oriente",
    name: "Lisboa Oriente Station",
    city: "Lisbon",
    country: "PT",
    lat: 38.77,
    tz: "Europe/Lisbon",
    type: "rail",
    typeLabel: "Rail station",
    controller: "Hunter ACC2",
    waterSource: "Mains",
    pricePerM3: 2.1,
    autopilot: true,
    coldClimate: false,
    zones: [
      [ZONE_KINDS.planter, 6],
      [ZONE_KINDS.roof, 8],
      [ZONE_KINDS.forecourt, 4],
    ],
    climate: {
      tMean: [11.5, 12.5, 14.5, 15.5, 18, 21, 23, 23.5, 22, 19, 15, 12.5],
      rainProb: [0.25, 0.22, 0.2, 0.2, 0.15, 0.06, 0.02, 0.03, 0.1, 0.2, 0.25, 0.27],
      rainMm: [9, 8, 7, 7, 5, 3, 2, 2, 6, 9, 10, 11],
      humidity: [80, 77, 72, 70, 68, 66, 64, 64, 67, 73, 78, 80],
      wind: 18,
    },
  },
  {
    id: "northwind-valencia",
    name: "Northwind Plant 2",
    city: "Valencia",
    country: "ES",
    lat: 39.47,
    tz: "Europe/Madrid",
    type: "factory",
    typeLabel: "Factory campus",
    controller: "Modbus gateway",
    waterSource: "Licensed borehole",
    pricePerM3: 0.6,
    dailyCapM3: 180,
    autopilot: true,
    coldClimate: false,
    zones: [
      [ZONE_KINDS.shrub, 8],
      [ZONE_KINDS.perimeter, 8],
      [ZONE_KINDS.dust, 6],
    ],
    climate: {
      tMean: [11.5, 12.5, 14, 16, 19, 23, 25.5, 26, 23.5, 19.5, 15, 12.5],
      rainProb: [0.1, 0.1, 0.1, 0.12, 0.1, 0.05, 0.02, 0.04, 0.1, 0.12, 0.12, 0.12],
      rainMm: [10, 10, 9, 9, 8, 6, 4, 6, 14, 18, 14, 12],
      humidity: [64, 64, 63, 63, 66, 67, 69, 70, 69, 68, 66, 66],
      wind: 14,
    },
  },
  {
    id: "stade-littoral",
    name: "Stade du Littoral",
    city: "Marseille",
    country: "FR",
    lat: 43.3,
    tz: "Europe/Paris",
    type: "stadium",
    typeLabel: "Stadium",
    controller: "Toro Lynx",
    waterSource: "Mains",
    pricePerM3: 3.2,
    autopilot: false,
    coldClimate: false,
    zones: [
      [ZONE_KINDS.pitch, 8],
      [ZONE_KINDS.stadiumSurround, 4],
    ],
    climate: {
      tMean: [7.5, 8.5, 11, 14, 18, 22, 25, 24.5, 20.5, 16, 11, 8],
      rainProb: [0.15, 0.13, 0.13, 0.15, 0.13, 0.08, 0.05, 0.07, 0.1, 0.15, 0.15, 0.15],
      rainMm: [9, 8, 8, 9, 8, 7, 5, 7, 12, 14, 12, 10],
      humidity: [70, 67, 64, 63, 63, 60, 56, 59, 65, 70, 72, 71],
      wind: 22,
    },
  },
  {
    id: "wola-park",
    name: "Wola Business Park",
    city: "Warsaw",
    country: "PL",
    lat: 52.23,
    tz: "Europe/Warsaw",
    type: "campus",
    typeLabel: "Office campus",
    controller: "Brook Edge",
    waterSource: "Rain tank + mains",
    pricePerM3: 3.4,
    autopilot: true,
    coldClimate: true,
    zones: [
      [ZONE_KINDS.bed, 12],
      [ZONE_KINDS.lawn, 12],
      [ZONE_KINDS.roofGarden, 6],
    ],
    climate: {
      tMean: [-1, 0, 3.5, 9, 14.5, 17.5, 19.5, 19, 14, 9, 4, 0.5],
      rainProb: [0.25, 0.22, 0.22, 0.22, 0.25, 0.27, 0.27, 0.25, 0.22, 0.22, 0.25, 0.27],
      rainMm: [4, 4, 5, 6, 7, 9, 9, 8, 7, 6, 5, 5],
      humidity: [86, 83, 77, 70, 70, 72, 73, 74, 79, 83, 87, 88],
      wind: 15,
    },
  },
];

export const ORG = {
  name: "Northwind Estates",
  initials: "NE",
  currency: "EUR",
  user: "Maria",
};

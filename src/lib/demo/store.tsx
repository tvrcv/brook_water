"use client";

import { createContext, use, useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { browser } from "react-dom";
import { buildWorld, type DemoWorld } from "./generate";
import { planFor } from "./engine";
import { rngFor } from "./rng";
import { TODAY_INDEX } from "./weather";
import { hourIn, m3 } from "../format";
import type { Alert, FeedEvent, Plan, Site } from "./types";

export interface Toast {
  id: string;
  title: string;
  body?: string;
  tone: "good" | "alert" | "info";
}

interface State {
  now: Date;
  tick: number;
  autopilot: Record<string, boolean>;
  paused: boolean;
  rainDelay: Record<string, boolean>;
  approved: Record<string, boolean>;
  resolvedLeaks: string[];
  alerts: Alert[];
  feed: FeedEvent[];
  toasts: Toast[];
  livePool: number;
}

type Action =
  | { type: "tick" }
  | { type: "autopilot"; siteId: string; on: boolean }
  | { type: "pause"; on: boolean }
  | { type: "rainDelay"; siteId: string | "all"; on: boolean; siteIds: string[] }
  | { type: "approve"; siteId: string }
  | { type: "resolveAlert"; alertId: string }
  | { type: "feed"; event: FeedEvent }
  | { type: "toast"; toast: Toast }
  | { type: "dismissToast"; id: string }
  | { type: "reset"; state: State };

let uid = 0;
const nextId = (p: string) => `${p}-${Date.now().toString(36)}-${(uid++).toString(36)}`;

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "tick":
      return { ...s, now: new Date(), tick: s.tick + 1 };
    case "autopilot":
      return { ...s, autopilot: { ...s.autopilot, [a.siteId]: a.on }, approved: { ...s.approved, [a.siteId]: false } };
    case "pause":
      return { ...s, paused: a.on };
    case "rainDelay": {
      const next = { ...s.rainDelay };
      for (const id of a.siteId === "all" ? a.siteIds : [a.siteId]) next[id] = a.on;
      return { ...s, rainDelay: next };
    }
    case "approve":
      return { ...s, approved: { ...s.approved, [a.siteId]: true } };
    case "resolveAlert": {
      const alert = s.alerts.find((x) => x.id === a.alertId);
      return {
        ...s,
        alerts: s.alerts.map((x) => (x.id === a.alertId ? { ...x, status: "resolved" } : x)),
        resolvedLeaks: alert?.zoneId && alert.id.startsWith("leak") ? [...s.resolvedLeaks, `${alert.siteId}:${alert.zoneId}`] : s.resolvedLeaks,
      };
    }
    case "feed":
      return { ...s, feed: [a.event, ...s.feed].slice(0, 60) };
    case "toast":
      return { ...s, toasts: [...s.toasts.slice(-2), a.toast] };
    case "dismissToast":
      return { ...s, toasts: s.toasts.filter((t) => t.id !== a.id) };
    case "reset":
      return a.state;
  }
}

function initialState(world: DemoWorld): State {
  return {
    now: world.now,
    tick: 0,
    autopilot: Object.fromEntries(world.sites.map((s) => [s.id, s.autopilot])),
    paused: false,
    rainDelay: {},
    approved: {},
    resolvedLeaks: [],
    alerts: world.alerts,
    feed: seedFeed(world),
    toasts: [],
    livePool: 0,
  };
}

/** The activity feed someone would see on opening the app. */
function seedFeed(world: DemoWorld): FeedEvent[] {
  const { now, sites } = world;
  const at = (min: number) => new Date(now.getTime() - min * 60_000);
  const ev: FeedEvent[] = [];
  let k = 3;
  for (const site of sites) {
    const plan = planFor(site);
    if (plan.mode === "winter") {
      ev.push({ id: nextId("f"), at: at(k += 31), siteId: site.id, title: "Winter mode on", why: `${site.name} · lines drained, frost sensors live`, amount: "", tone: "info", icon: "frost" });
      continue;
    }
    if (plan.mode === "manual") {
      ev.push({ id: nextId("f"), at: at(k += 27), siteId: site.id, title: "Fixed schedule tonight", why: `${site.name} · Autopilot would use ${m3(plan.plannedM3 - plan.potentialM3)} less`, amount: "Manual", tone: "info", icon: "calendar" });
      continue;
    }
    for (const r of plan.reasons.slice(0, 2)) {
      if (r.key === "leak") continue;
      const icon: FeedEvent["icon"] = r.key === "rain" ? "rain" : r.key === "frost" ? "frost" : r.key === "wind" ? "wind" : r.key === "et" ? "bolt" : "drop";
      ev.push({
        id: nextId("f"),
        at: at(k += 19),
        siteId: site.id,
        title: r.m3 >= 0 ? r.label : r.label,
        why: `${site.name} · ${r.why}`,
        amount: r.m3 >= 0 ? `−${m3(r.m3)}` : `+${m3(-r.m3)}`,
        tone: r.m3 >= 0 ? "good" : "info",
        icon,
      });
    }
  }
  const leak = world.alerts.find((a) => a.id === "leak-pv-f14");
  if (leak) ev.push({ id: nextId("f"), at: leak.at, siteId: leak.siteId, title: "Held fairway F14", why: "Pine Valley · flow 38% above normal, possible leak", amount: "Alert", tone: "alert", icon: "alert" });
  const y = TODAY_INDEX - 1;
  const ySaved = sites.reduce((a, s) => a + Math.max(0, s.usage[y].fixed - s.usage[y].used), 0);
  ev.push({ id: nextId("f"), at: at(k += 140), siteId: "all", title: "Yesterday’s savings", why: `All sites · under the old schedule`, amount: `−${m3(ySaved)}`, tone: "good", icon: "check" });
  return ev.sort((a, b) => b.at.getTime() - a.at.getTime());
}

const LIVE_POOL: Omit<FeedEvent, "id" | "at">[] = [
  { siteId: "pine-valley", title: "Forecast updated", why: "Pine Valley · overnight rain chance now 78%", amount: "", tone: "info", icon: "rain" },
  { siteId: "northwind-valencia", title: "Dust control trimmed", why: "Northwind Plant 2 · wind dropped to 9 km/h", amount: "−1.2 m³", tone: "good", icon: "wind" },
  { siteId: "lisboa-oriente", title: "Planters checked", why: "Lisboa Oriente · all 6 planters inside target band", amount: "", tone: "good", icon: "check" },
  { siteId: "pine-valley", title: "Soil probes synced", why: "Pine Valley · 64 zones reporting", amount: "", tone: "info", icon: "sensor" },
  { siteId: "stade-littoral", title: "Autopilot suggestion", why: "Stade du Littoral · pitch is moist, 4 zones could skip tonight", amount: "", tone: "info", icon: "calendar" },
  { siteId: "wola-park", title: "Frost guard check", why: "Wola Business Park · backflow heater on at 2 °C", amount: "", tone: "info", icon: "frost" },
  { siteId: "northwind-valencia", title: "Borehole within licence", why: "Northwind Plant 2 · yesterday used 61% of the daily cap", amount: "", tone: "good", icon: "check" },
  { siteId: "pine-valley", title: "Pump pressure steady", why: "Pine Valley · 6.1 bar on the main line", amount: "", tone: "good", icon: "bolt" },
];

export interface Demo {
  world: DemoWorld;
  now: Date;
  tick: number;
  sites: Site[];
  plans: Record<string, Plan>;
  alerts: Alert[];
  openAlerts: Alert[];
  feed: FeedEvent[];
  toasts: Toast[];
  paused: boolean;
  approved: Record<string, boolean>;
  rainDelay: Record<string, boolean>;
  liveFlow: (siteId: string) => number;
  site: (id: string) => Site | undefined;
  actions: {
    setAutopilot: (siteId: string, on: boolean) => void;
    setPaused: (on: boolean) => void;
    setRainDelay: (siteId: string | "all", on: boolean) => void;
    approve: (siteId: string) => void;
    resolveAlert: (alertId: string) => void;
    toast: (t: Omit<Toast, "id">) => void;
    pushEvent: (e: Omit<FeedEvent, "id" | "at">) => void;
    dismissToast: (id: string) => void;
    reset: () => void;
  };
}

const Ctx = createContext<Demo | null>(null);

export function useDemo() {
  const d = use(Ctx);
  if (!d) throw new Error("useDemo must be used inside <DemoProvider>");
  return d;
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  // Demo data depends on the visitor's date and clock, so it is built in the browser only.
  use(browser("The demo world is generated for the visitor’s current date."));
  const [world, setWorld] = useState(() => buildWorld(new Date()));
  const [state, dispatch] = useReducer(reducer, world, initialState);

  useEffect(() => {
    const id = setInterval(() => dispatch({ type: "tick" }), 3000);
    return () => clearInterval(id);
  }, []);

  // A new event arrives every ~20 s so the product feels alive in a demo.
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      const e = LIVE_POOL[i++ % LIVE_POOL.length];
      const event: FeedEvent = { ...e, id: nextId("live"), at: new Date() };
      dispatch({ type: "feed", event });
    }, 20_000);
    return () => clearInterval(id);
  }, []);

  const sites = useMemo(
    () => world.sites.map((s) => ({ ...s, autopilot: state.autopilot[s.id] ?? s.autopilot })),
    [world, state.autopilot],
  );

  const plans = useMemo(() => {
    const resolved = new Set(state.resolvedLeaks.filter((k) => k.includes(":")).map((k) => k.split(":")[1]));
    return Object.fromEntries(
      sites.map((s) => [
        s.id,
        planFor(s, { paused: state.paused, rainDelay: !!state.rainDelay[s.id], resolvedLeaks: resolved }),
      ]),
    ) as Record<string, Plan>;
  }, [sites, state.paused, state.rainDelay, state.resolvedLeaks]);

  const liveFlow = useCallback(
    (siteId: string) => {
      const site = sites.find((s) => s.id === siteId);
      const plan = plans[siteId];
      if (!site || !plan) return 0;
      const h = hourIn(site.tz, state.now);
      const r = rngFor(siteId, "flow", state.tick)();
      const night = h >= 22 || h < 3;
      let base = 0;
      if (night && plan.watering > 0) base = plan.plannedM3 / 3.5;
      else if (site.type === "factory" && plan.mode !== "winter") base = 1.4;
      else if (site.type === "rail" && plan.mode !== "winter") base = 0.25;
      else if (site.type === "golf") base = 1.8; // hand-watering and clubhouse
      return base * (0.92 + r * 0.16);
    },
    [sites, plans, state.now, state.tick],
  );

  const actions = useMemo<Demo["actions"]>(() => {
    const toast = (t: Omit<Toast, "id">) => {
      const id = nextId("t");
      dispatch({ type: "toast", toast: { ...t, id } });
    };
    return {
      setAutopilot: (siteId, on) => dispatch({ type: "autopilot", siteId, on }),
      setPaused: (on) => dispatch({ type: "pause", on }),
      setRainDelay: (siteId, on) =>
        dispatch({ type: "rainDelay", siteId, on, siteIds: world.sites.map((s) => s.id) }),
      approve: (siteId) => dispatch({ type: "approve", siteId }),
      resolveAlert: (alertId) => dispatch({ type: "resolveAlert", alertId }),
      toast,
      pushEvent: (e) => dispatch({ type: "feed", event: makeEvent(e) }),
      dismissToast: (id) => dispatch({ type: "dismissToast", id }),
      reset: () => {
        const w = buildWorld(new Date());
        setWorld(w);
        dispatch({ type: "reset", state: initialState(w) });
      },
    };
  }, [world]);

  const value: Demo = {
    world,
    now: state.now,
    tick: state.tick,
    sites,
    plans,
    alerts: state.alerts,
    openAlerts: state.alerts.filter((a) => a.status === "open"),
    feed: state.feed,
    toasts: state.toasts,
    paused: state.paused,
    approved: state.approved,
    rainDelay: state.rainDelay,
    liveFlow,
    site: (id) => sites.find((s) => s.id === id),
    actions,
  };

  return <Ctx value={value}>{children}</Ctx>;
}

/** Push a feed event from UI actions (approve, leak fixed, ...). */
export function makeEvent(e: Omit<FeedEvent, "id" | "at">): FeedEvent {
  return { ...e, id: nextId("ev"), at: new Date() };
}

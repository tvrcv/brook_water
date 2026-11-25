"use client";

import clsx from "clsx";
import { useState } from "react";
import { Building2, Factory, Flag, TrainFront, Trophy, Wrench, ShieldCheck } from "lucide-react";
import { useDemo } from "@/lib/demo/store";
import { TODAY_INDEX } from "@/lib/demo/weather";
import { avgMoisture } from "@/lib/demo/stats";
import { ago, clock, fmt1, m3 } from "@/lib/format";
import type { Alert, FeedEvent, Plan, Site, SiteType } from "@/lib/demo/types";
import { Button, FeedIcon, Modal, Pill } from "./ui";

const TYPE_ICON: Record<SiteType, typeof Flag> = {
  golf: Flag,
  rail: TrainFront,
  factory: Factory,
  stadium: Trophy,
  campus: Building2,
};

export function SiteIcon({ type, size = 18, className }: { type: SiteType; size?: number; className?: string }) {
  const I = TYPE_ICON[type];
  return <I size={size} className={className} aria-hidden />;
}

export function ModePill({ plan, alerts = 0 }: { plan: Plan; alerts?: number }) {
  if (alerts > 0) return <Pill tone="coral">Autopilot · {alerts} alert{alerts > 1 ? "s" : ""}</Pill>;
  switch (plan.mode) {
    case "autopilot":
      return <Pill tone="aqua">Autopilot</Pill>;
    case "manual":
      return <Pill tone="muted">Manual</Pill>;
    case "paused":
      return <Pill tone="amber">Paused</Pill>;
    case "rain-delay":
      return <Pill tone="amber">Rain delay</Pill>;
    case "winter":
      return <Pill tone="muted">Winter mode</Pill>;
  }
}

export function FeedList({ events, limit, compact }: { events: FeedEvent[]; limit?: number; compact?: boolean }) {
  const { now } = useDemo();
  const list = limit ? events.slice(0, limit) : events;
  return (
    <ul className="flex flex-col">
      {list.map((e) => (
        <li key={e.id} className="flex animate-rise items-center gap-3 border-t border-ink-750 py-3 first:border-t-0">
          <FeedIcon icon={e.icon} tone={e.tone} size={compact ? 36 : 40} />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-sm font-semibold">{e.title}</span>
            <span className={clsx("text-xs leading-snug text-mute", compact && "truncate")}>{e.why}</span>
          </span>
          <span className="flex shrink-0 flex-col items-end gap-0.5">
            {e.amount && (
              <span className={clsx("font-display text-[15px] font-semibold tnum", e.tone === "good" && "text-lime", e.tone === "alert" && "text-coral", e.tone === "info" && "text-aqua")}>
                {e.amount}
              </span>
            )}
            <span className="text-xs text-mute">{now.getTime() - e.at.getTime() < 3600_000 ? ago(e.at, now) : clock(e.at)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** The live inputs Autopilot reads for one site. */
export function factorTiles(site: Site, plan: Plan) {
  const w = site.weather[TODAY_INDEX];
  const t = site.weather[TODAY_INDEX + 1];
  const winter = plan.mode === "winter";
  const rainSoon = t.rainProb >= 0.5 && t.rainMm > 0;
  const avg = avgMoisture(site);
  const kinds = [...new Set(site.zones.map((z) => z.kind))];
  const lo = Math.min(...kinds.map((k) => k.band[0]));
  const hi = Math.max(...kinds.map((k) => k.band[1]));
  type Tone = "good" | "warn" | "muted";
  const tiles: { label: string; value: string; note: string; tone: Tone }[] = [
    { label: "Evapotranspiration", value: `${w.et0} mm`, note: w.et0 < w.et0Normal ? `Below normal (${w.et0Normal})` : `Above normal (${w.et0Normal})`, tone: w.et0 < w.et0Normal ? "good" : "warn" },
    { label: "Rain next 24 h", value: `${t.rainMm} mm`, note: rainSoon ? `${Math.round(t.rainProb * 100)}% chance overnight` : `${Math.round(t.rainProb * 100)}% chance`, tone: rainSoon ? "good" : "muted" },
    { label: "Humidity", value: `${w.humidity}%`, note: t.humidity > w.humidity ? "Rising overnight" : "Falling overnight", tone: "muted" },
    { label: "Wind", value: `${w.wind} km/h`, note: w.wind >= 25 ? "Drift risk · spray waits" : "Calm enough to spray", tone: w.wind >= 25 ? "warn" : "muted" },
    { label: "Daylight", value: `${Math.floor(w.daylightH)} h ${Math.round((w.daylightH % 1) * 60)} m`, note: `Solar ${w.solar} MJ/m²`, tone: "muted" },
    { label: "Soil moisture", value: `${avg}% VWC`, note: `Target band ${lo}–${hi}%`, tone: avg >= lo && avg <= hi ? "good" : "warn" },
    { label: "Air temperature", value: `${Math.round(w.tMin)}–${Math.round(w.tMax)} °C`, note: t.tMin <= 1 ? `Frost risk tonight (${t.tMin} °C)` : "No frost risk", tone: t.tMin <= 1 ? "warn" : "muted" },
    { label: "Water source", value: `€${fmt1(site.pricePerM3)}/m³`, note: site.waterSource, tone: "muted" },
    { label: "Power tariff", value: winter ? "—" : "Off-peak 22:00", note: winter ? "Pumps idle for winter" : "Pumps follow the cheap window", tone: winter ? "muted" : "good" },
    { label: "Limits", value: site.dailyCapM3 ? `${fmt1(site.dailyCapM3).replace(".0", "")} m³/day` : "No cap", note: site.dailyCapM3 ? "Licence cap · enforced" : "No active restrictions", tone: "muted" },
  ];
  return tiles;
}

export function FactorGrid({ site, plan, compact }: { site: Site; plan: Plan; compact?: boolean }) {
  const tiles = factorTiles(site, plan);
  return (
    <div className={clsx("grid grid-cols-2 gap-2.5 sm:grid-cols-3", !compact && "xl:grid-cols-5")}>
      {tiles.map((f) => (
        <div key={f.label} className="flex flex-col gap-1.5 rounded-2xl border border-ink-700 bg-ink-850 px-4 py-3.5">
          <span className="text-xs text-mute">{f.label}</span>
          <span className="font-display text-[22px] font-semibold tracking-[-0.02em] tnum">{f.value}</span>
          <span className={clsx("text-xs", f.tone === "good" && "text-lime", f.tone === "warn" && "text-amber", f.tone === "muted" && "text-mute")}>{f.note}</span>
        </div>
      ))}
    </div>
  );
}

/** Flow curve and the remote fix for the Pine Valley leak — the "wow" moment of the demo. */
export function LeakModal({ alert, open, onClose }: { alert: Alert | null; open: boolean; onClose: () => void }) {
  const { actions, site: getSite } = useDemo();
  const [step, setStep] = useState<"look" | "done">("look");
  if (!alert) return null;
  const site = getSite(alert.siteId);
  const normal = [0.2, 0.2, 0.3, 0.2, 0.2, 0.3, 0.2, 0.2, 0.3, 0.2, 0.2, 0.2];
  const now = [0.2, 0.3, 0.2, 0.3, 0.2, 0.3, 1.9, 2.2, 2.4, 2.3, 2.5, 2.4];
  const max = 2.8;
  const close = () => {
    onClose();
    setTimeout(() => setStep("look"), 300);
  };
  const fix = () => {
    actions.resolveAlert(alert.id);
    actions.pushEvent({ siteId: alert.siteId, title: `Leak isolated · ${alert.zoneId}`, why: `${site?.name} · lateral valve closed, crew notified`, amount: "Fixed", tone: "good", icon: "check" });
    actions.toast({ title: `Leak isolated at ${alert.zoneId}`, body: "Valve closed remotely · crew ticket created", tone: "good" });
    setStep("done");
  };
  return (
    <Modal open={open} onClose={close} title={alert.title} wide>
      {step === "look" ? (
        <div className="flex flex-col gap-5">
          <p className="text-sm leading-relaxed text-soft">{alert.body}</p>
          <div className="rounded-2xl bg-ink-800 p-4">
            <div className="mb-3 flex items-center justify-between text-xs text-mute">
              <span>Flow on the {alert.zoneId} lateral, last 12 hours (m³/h)</span>
              <span className="flex gap-3">
                <span className="flex items-center gap-1"><span className="h-0.5 w-3 bg-mute" />Normal</span>
                <span className="flex items-center gap-1"><span className="h-0.5 w-3 bg-coral" />Now</span>
              </span>
            </div>
            <svg viewBox="0 0 240 90" className="h-32 w-full" role="img" aria-label="Flow jumped from about 0.2 to 2.4 cubic metres per hour six hours ago while the valve was closed">
              <polyline fill="none" stroke="var(--color-mute)" strokeWidth="1.5" strokeDasharray="4 3" points={normal.map((v, i) => `${(i / 11) * 236 + 2},${88 - (v / max) * 84}`).join(" ")} />
              <polyline fill="none" stroke="var(--color-coral)" strokeWidth="2.5" strokeLinejoin="round" points={now.map((v, i) => `${(i / 11) * 236 + 2},${88 - (v / max) * 84}`).join(" ")} />
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-ink-800 p-3"><div className="font-display text-xl font-semibold text-coral">+38%</div><div className="text-xs text-mute">over normal</div></div>
            <div className="rounded-2xl bg-ink-800 p-3"><div className="font-display text-xl font-semibold">~2.3 m³/h</div><div className="text-xs text-mute">being lost</div></div>
            <div className="rounded-2xl bg-ink-800 p-3"><div className="font-display text-xl font-semibold">€{fmt1(2.3 * 24 * (site?.pricePerM3 ?? 1))}</div><div className="text-xs text-mute">per day if left</div></div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="danger" size="lg" className="flex-1" onClick={fix}>
              <Wrench size={18} /> Close valve & send crew
            </Button>
            <Button size="lg" onClick={close}>Keep watching</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <span className="flex size-16 animate-pop items-center justify-center rounded-full bg-lime/15 text-lime">
            <ShieldCheck size={30} />
          </span>
          <div className="font-display text-2xl font-semibold">Leak isolated</div>
          <p className="max-w-sm text-sm text-soft">
            The {alert.zoneId} lateral valve is closed and a crew ticket is open. {alert.zoneId} rejoins tonight’s plan, fed from the next lateral.
          </p>
          <Button variant="primary" size="lg" onClick={close}>Done</Button>
        </div>
      )}
    </Modal>
  );
}

export function RainDelayModal({ open, onClose, siteId }: { open: boolean; onClose: () => void; siteId?: string }) {
  const { actions, rainDelay, sites } = useDemo();
  const target = siteId ? sites.filter((s) => s.id === siteId) : sites;
  const anyOn = target.some((s) => rainDelay[s.id]);
  const apply = (on: boolean) => {
    actions.setRainDelay(siteId ?? "all", on);
    actions.toast({
      title: on ? "Rain delay on" : "Rain delay cleared",
      body: on ? `${siteId ? target[0]?.name : "All sites"} skip tonight` : "Autopilot plans are back",
      tone: "info",
    });
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={siteId ? `Rain delay · ${target[0]?.name}` : "Rain delay · all sites"}>
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-soft">
          Skips tonight’s watering. Autopilot picks up again tomorrow evening with fresh forecast and soil readings.
        </p>
        <div className="rounded-2xl bg-ink-800 p-4 text-sm">
          <div className="flex justify-between"><span className="text-mute">Sites</span><span className="font-semibold">{target.length}</span></div>
          <div className="mt-2 flex justify-between"><span className="text-mute">Zones affected</span><span className="font-semibold">{target.reduce((a, s) => a + s.zones.length, 0)}</span></div>
        </div>
        <div className="flex gap-2">
          {anyOn ? (
            <Button variant="primary" size="lg" className="flex-1" onClick={() => apply(false)}>Clear rain delay</Button>
          ) : (
            <Button variant="primary" size="lg" className="flex-1" onClick={() => apply(true)}>Skip tonight</Button>
          )}
          <Button size="lg" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

export function planSummary(plan: Plan) {
  if (plan.mode === "winter") return "Winter mode · no watering";
  if (plan.mode === "paused") return "Paused · no watering tonight";
  if (plan.mode === "rain-delay") return "Rain delay · skipping tonight";
  if (plan.mode === "manual") return `Fixed schedule · ${m3(plan.plannedM3)}`;
  return `${m3(plan.plannedM3)} · ${plan.watering} zones`;
}

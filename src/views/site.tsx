"use client";

import clsx from "clsx";
import Link from "next/link";
import { notFound, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Check, CloudRain, Droplets, Lock, SkipForward, Snowflake, Sparkles } from "lucide-react";
import { useDemo } from "@/lib/demo/store";
import { TODAY_INDEX } from "@/lib/demo/weather";
import { eur, fmt1, m3, timeIn } from "@/lib/format";
import { AnimatedNumber, Button, Card, LiveDot, Pill, SectionTitle, Switch } from "@/components/ui";
import { ForecastStrip, MoistureBars } from "@/components/charts";
import { FactorGrid, LeakModal, RainDelayModal } from "@/components/domain";
import type { ZoneDecision } from "@/lib/demo/types";

function tileColor(vwc: number, band: [number, number]) {
  if (vwc < band[0]) return "bg-dry text-[#2a1a02]";
  if (vwc < band[1]) return "bg-band text-[#03131a]";
  return "bg-wet text-fg";
}

export function SiteView({ id }: { id: string }) {
  const { site: getSite, plans, alerts, openAlerts, approved, rainDelay, actions, now, liveFlow } = useDemo();
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [rainOpen, setRainOpen] = useState(false);
  const [leakId, setLeakId] = useState<string | null>(null);
  const site = getSite(id);
  if (!site) notFound();
  const plan = plans[site.id];
  const siteAlerts = openAlerts.filter((a) => a.siteId === site.id);
  const leakAlert = alerts.find((a) => a.id === leakId) ?? null;

  const byId = new Map(plan.decisions.map((d) => [d.zone.id, d]));
  const defaultZone = siteAlerts.find((a) => a.zoneId)?.zoneId ?? plan.decisions.find((d) => d.action === "water")?.zone.id ?? site.zones[0].id;
  const selId = params.get("zone") && byId.has(params.get("zone")!) ? params.get("zone")! : defaultZone;
  const sel = byId.get(selId)!;
  const select = (zid: string) => router.replace(`${path}?zone=${zid}`, { scroll: false });

  const groups: { label: string; items: ZoneDecision[] }[] = [];
  for (const d of plan.decisions) {
    const g = groups.find((x) => x.label === d.zone.kind.plural);
    if (g) g.items.push(d);
    else groups.push({ label: d.zone.kind.plural, items: [d] });
  }

  const saved = Math.max(0, plan.fixedM3 - plan.plannedM3);
  const isApproved = approved[site.id];
  const maxReason = Math.max(1, ...plan.reasons.map((r) => Math.abs(r.m3)));
  const today = site.weather[TODAY_INDEX];

  const approve = () => {
    actions.approve(site.id);
    actions.pushEvent({ siteId: site.id, title: "Plan approved", why: `${site.name} · ${m3(plan.plannedM3)} from ${plan.windowStart}`, amount: saved > 0 ? `−${m3(saved)}` : "", tone: "good", icon: "check" });
    actions.toast({ title: "Plan approved", body: `${site.name} starts at ${plan.windowStart}`, tone: "good" });
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <Link href="/app/sites" aria-label="Back to sites" className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-xl border border-ink-700 bg-ink-850 hover:bg-ink-800">
              <ArrowLeft size={18} />
            </Link>
            <div className="flex flex-col gap-1.5">
              <h1 className="font-display text-[28px] leading-tight font-semibold tracking-[-0.02em] sm:text-3xl">{site.name}</h1>
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-mute">
                {site.typeLabel} · {site.city}, {site.country} · {site.zones.length} zones · {site.controller}
                <span className="flex items-center gap-1.5 text-lime"><LiveDot className="size-1.5" /> Connected</span>
                <span>· local time {timeIn(site.tz, now)}</span>
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex h-11 items-center gap-3 rounded-xl border border-ink-700 bg-ink-850 pr-2 pl-4 text-sm font-medium">
              Autopilot
              <Switch
                size="sm"
                on={site.autopilot}
                label={`Autopilot for ${site.name}`}
                onChange={(on) => {
                  actions.setAutopilot(site.id, on);
                  actions.toast({ title: on ? "Autopilot on" : "Autopilot off", body: on ? `${site.name} follows weather and soil from tonight` : `${site.name} runs its fixed schedule`, tone: on ? "good" : "info" });
                }}
              />
            </label>
            <Button onClick={() => setRainOpen(true)}>
              <CloudRain size={16} /> {rainDelay[site.id] ? "Rain delay on" : "Rain delay"}
            </Button>
            {plan.mode === "autopilot" && plan.watering > 0 && (
              <Button variant="primary" onClick={approve} disabled={isApproved}>
                {isApproved ? <><Check size={16} /> Approved</> : "Approve plan"}
              </Button>
            )}
          </div>
        </div>
      </header>

      {plan.mode === "manual" && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-aqua/30 bg-aqua/8 p-4">
          <Sparkles size={20} className="text-aqua" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-semibold">Autopilot is off. Tonight runs the fixed schedule: {m3(plan.plannedM3)}.</span>
            <span className="text-xs text-soft">With Autopilot, tonight would use {m3(plan.potentialM3)} — {m3(plan.plannedM3 - plan.potentialM3)} less, about {eur((plan.plannedM3 - plan.potentialM3) * site.pricePerM3)}.</span>
          </span>
          <Button variant="primary" size="sm" onClick={() => { actions.setAutopilot(site.id, true); actions.toast({ title: "Autopilot on", body: site.name, tone: "good" }); }}>Turn on Autopilot</Button>
        </div>
      )}
      {plan.mode === "winter" && (
        <div className="flex items-center gap-4 rounded-2xl border border-peri/30 bg-peri/8 p-4">
          <Snowflake size={20} className="text-peri" />
          <span className="flex flex-col">
            <span className="text-sm font-semibold">Winter mode · lines drained until spring</span>
            <span className="text-xs text-soft">Brook keeps watching frost on the backflow preventer, the rain tank level and any flow on drained lines. Autopilot restarts when soil stays above 5 °C for a week.</span>
          </span>
        </div>
      )}
      {(plan.mode === "paused" || plan.mode === "rain-delay") && (
        <div className="flex items-center gap-4 rounded-2xl border border-amber/30 bg-amber/8 p-4">
          <SkipForward size={20} className="text-amber" />
          <span className="text-sm font-semibold">{plan.mode === "paused" ? "All watering is paused." : "Rain delay is on."} Nothing runs tonight. The fixed schedule would have used {m3(plan.fixedM3)}.</span>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="flex flex-col gap-1.5 rounded-[1.25rem] px-5 py-4">
          <span className="text-xs text-mute">Planned tonight</span>
          <span className="font-display text-[30px] font-bold tracking-[-0.02em]"><AnimatedNumber value={plan.plannedM3} format={(n) => (n < 100 ? fmt1(n) : Math.round(n).toLocaleString("en-US"))} /> m³</span>
          <span className="text-xs text-soft">{plan.watering} watering · {plan.skipped} skipped</span>
        </Card>
        <Card className="flex flex-col gap-1.5 rounded-[1.25rem] px-5 py-4">
          <span className="text-xs text-mute">Fixed timers would use</span>
          <span className="font-display text-[30px] font-bold tracking-[-0.02em] text-soft">{m3(plan.fixedM3)}</span>
          <span className="text-xs text-soft">Every zone, seasonal run-time</span>
        </Card>
        <Card className="flex flex-col gap-1.5 rounded-[1.25rem] px-5 py-4">
          <span className="text-xs text-mute">Saved tonight</span>
          <span className="font-display text-[30px] font-bold tracking-[-0.02em] text-lime">{m3(saved)}</span>
          <span className="text-xs text-soft">{plan.fixedM3 > 0 ? `−${Math.round((saved / plan.fixedM3) * 100)}% · ${eur(plan.costSaved)}` : "Nothing to compare"}</span>
        </Card>
        <Card className="flex flex-col gap-1.5 rounded-[1.25rem] px-5 py-4">
          <span className="text-xs text-mute">Live flow</span>
          <span className="font-display text-[30px] font-bold tracking-[-0.02em]"><AnimatedNumber value={liveFlow(site.id)} format={(n) => fmt1(n)} /> m³/h</span>
          <span className="text-xs text-soft">{plan.watering > 0 ? `Window ${plan.windowStart}–${plan.windowEnd}` : "No run tonight"}</span>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card className="flex flex-col gap-4 p-5 sm:p-6">
            <SectionTitle aside={<span className="text-xs text-mute">Tap a zone for details</span>}>Soil moisture by zone</SectionTitle>
            {groups.map((g) => (
              <div key={g.label} className="flex flex-col gap-2">
                <span className="text-xs font-medium text-mute">{g.label} · {g.items.length}</span>
                <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9">
                  {g.items.map((d) => {
                    const z = d.zone;
                    const on = z.id === selId;
                    return (
                      <button
                        key={z.id}
                        onClick={() => select(z.id)}
                        aria-pressed={on}
                        aria-label={`${z.kind.label} ${z.n}, ${z.vwc}% moisture, ${d.action === "water" ? "watering tonight" : d.action === "hold" ? "held" : "skipped tonight"}`}
                        className={clsx(
                          "relative flex min-h-[52px] flex-col justify-between rounded-xl px-2 py-1.5 text-left transition hover:brightness-110 active:scale-95",
                          tileColor(z.vwc, z.kind.band),
                          on && "ring-2 ring-fg ring-offset-2 ring-offset-ink-850",
                        )}
                      >
                        <span className="text-[11px] font-semibold opacity-80">{z.id}</span>
                        <span className="font-display text-sm font-semibold tnum">{z.vwc}%</span>
                        <span
                          className={clsx(
                            "absolute top-1.5 right-1.5 size-2 rounded-full",
                            d.action === "water" && "bg-fg shadow",
                            d.action === "hold" && "bg-coral",
                            d.action === "skip" && "border-[1.5px] border-current opacity-60",
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1 text-xs text-soft">
              <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-dry" />Under target</span>
              <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-band" />In target band</span>
              <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-wet" />Wet</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-fg" />Watering tonight</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full border-[1.5px] border-soft" />Skipped</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-coral" />Held</span>
            </div>
          </Card>

          {plan.reasons.length > 0 && (
            <Card className="flex flex-col gap-4 p-5 sm:p-6">
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-xl font-semibold">Why Autopilot planned it this way</h2>
                <span className="text-[13px] text-mute">Change against the fixed schedule, by reason</span>
              </div>
              {plan.reasons.map((r) => (
                <div key={r.key} className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_76px] items-center gap-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1.6fr)_90px] sm:gap-4">
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-semibold">{r.label}</span>
                    <span className="text-xs text-mute">{r.why}</span>
                  </span>
                  <span className="h-2.5 rounded-full bg-ink-750">
                    <span
                      className={clsx("block h-full rounded-full transition-[width] duration-700", r.m3 < 0 ? "bg-amber" : r.key === "rain" ? "bg-lime" : r.key === "leak" ? "bg-coral" : r.key === "et" ? "bg-peri" : "bg-aqua")}
                      style={{ width: `${(Math.abs(r.m3) / maxReason) * 100}%` }}
                    />
                  </span>
                  <span className={clsx("text-right font-display text-[15px] font-semibold tnum", r.m3 < 0 ? "text-amber" : "text-lime")}>
                    {r.m3 < 0 ? "+" : "−"}{m3(Math.abs(r.m3))}
                  </span>
                </div>
              ))}
              {plan.notes.length > 0 && (
                <div className="flex flex-wrap gap-2 border-t border-ink-750 pt-4">
                  {plan.notes.map((n) => (
                    <span key={n} className="rounded-full bg-ink-800 px-3 py-1.5 text-xs text-soft">{n}</span>
                  ))}
                </div>
              )}
            </Card>
          )}

          <section className="flex flex-col gap-3">
            <SectionTitle>Inputs right now</SectionTitle>
            <FactorGrid site={site} plan={plan} compact />
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Card className="flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <span className="flex flex-col gap-1">
                <span className="text-xs text-mute">Selected zone</span>
                <span className="font-display text-2xl font-semibold">{sel.zone.id} · {sel.zone.kind.label} {sel.zone.n}</span>
              </span>
              {sel.action === "water" ? <Pill tone="aqua">Watering tonight</Pill> : sel.action === "hold" ? <Pill tone="coral">Held · leak check</Pill> : <Pill tone="muted">Skipping tonight</Pill>}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1 rounded-2xl bg-ink-800 px-4 py-3"><span className="text-xs text-mute">Soil moisture</span><span className="font-display text-xl font-semibold">{sel.zone.vwc}% VWC</span><span className="text-xs text-mute">Target {sel.zone.kind.band[0]}–{sel.zone.kind.band[1]}%</span></div>
              <div className="flex flex-col gap-1 rounded-2xl bg-ink-800 px-4 py-3"><span className="text-xs text-mute">Tonight</span><span className="font-display text-xl font-semibold">{sel.action === "water" ? m3(sel.plannedM3) : sel.action === "hold" ? "Held" : "Skipped"}</span><span className="text-xs text-mute">{sel.action === "water" ? `${sel.minutes} min run` : sel.note}</span></div>
              <div className="flex flex-col gap-1 rounded-2xl bg-ink-800 px-4 py-3"><span className="text-xs text-mute">Salinity</span><span className="font-display text-xl font-semibold">{sel.zone.ec} dS/m</span><span className="text-xs text-mute">{site.waterSource}</span></div>
              <div className="flex flex-col gap-1 rounded-2xl bg-ink-800 px-4 py-3"><span className="text-xs text-mute">Soil temperature</span><span className="font-display text-xl font-semibold">{sel.zone.soilTemp} °C</span><span className="text-xs text-mute">Probe at 7 cm</span></div>
            </div>
            <div className="text-xs text-soft">Why: {sel.note}{sel.fixedM3 > 0 ? ` · fixed timer: ${m3(sel.fixedM3)}` : ""}</div>
            <MoistureBars values={sel.zone.history} band={sel.zone.kind.band} />
            <div className="grid grid-cols-3 gap-2">
              {sel.action === "hold" ? (
                <Button variant="danger" className="col-span-3" onClick={() => setLeakId(siteAlerts.find((a) => a.zoneId === sel.zone.id)?.id ?? null)}>Inspect leak</Button>
              ) : (
                <>
                  <Button variant="primary" onClick={() => actions.toast({ title: `Watering ${sel.zone.id} now`, body: `${sel.zone.kind.minutes} min manual run · logged`, tone: "info" })}><Droplets size={16} />Water now</Button>
                  <Button onClick={() => actions.toast({ title: `${sel.zone.id} skips tonight`, body: "Manual override for 24 h", tone: "info" })}><SkipForward size={16} />Skip</Button>
                  <Button onClick={() => actions.toast({ title: `${sel.zone.id} settings locked`, body: "Autopilot won’t change this zone", tone: "info" })}><Lock size={16} />Lock</Button>
                </>
              )}
            </div>
          </Card>

          <Card className="flex flex-col p-5 sm:p-6">
            <h2 className="mb-3 font-display text-xl font-semibold">Tonight, step by step</h2>
            {plan.steps.length === 0 ? (
              <p className="text-sm text-mute">No watering tonight.</p>
            ) : (
              <ol className="flex flex-col">
                {plan.steps.map((st, i) => (
                  <li key={i} className="grid grid-cols-[52px_14px_minmax(0,1fr)_auto] items-start gap-3 py-2.5">
                    <span className="font-display text-sm font-semibold text-soft tnum">{st.time}</span>
                    <span className={clsx("mt-1 size-2.5 rounded-full", st.tone === "water" ? "bg-aqua" : st.tone === "info" ? "bg-lime" : "bg-mute")} />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold">{st.title}</span>
                      <span className="text-xs text-mute">{st.sub}</span>
                    </span>
                    <span className="font-display text-sm font-semibold text-soft tnum">{st.m3 != null ? m3(st.m3) : ""}</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card className="flex flex-col gap-3 p-5 sm:p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl font-semibold">Next 7 days</h2>
              <span className="text-xs text-mute">ET today {today.et0} mm</span>
            </div>
            <ForecastStrip days={site.weather.slice(TODAY_INDEX, TODAY_INDEX + 7)} />
          </Card>
        </div>
      </section>

      <RainDelayModal open={rainOpen} onClose={() => setRainOpen(false)} siteId={site.id} />
      <LeakModal alert={leakAlert} open={!!leakAlert} onClose={() => setLeakId(null)} />
    </div>
  );
}

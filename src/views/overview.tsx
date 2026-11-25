"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ArrowRight, CloudRain, Pause, Play, Plus, Radio } from "lucide-react";
import { useDemo } from "@/lib/demo/store";
import { lastNDays } from "@/lib/demo/generate";
import { orgStats, siteMonth } from "@/lib/demo/stats";
import { ORG } from "@/lib/demo/catalog";
import { eur, fmt, fmt1, greeting, longDate, m3 } from "@/lib/format";
import { AnimatedNumber, Button, ButtonLink, Card, LiveDot, Pill, SectionTitle, Switch } from "@/components/ui";
import { Sparkbars, UsageChart } from "@/components/charts";
import { FactorGrid, FeedList, LeakModal, ModePill, RainDelayModal, SiteIcon, planSummary } from "@/components/domain";

export function OverviewView() {
  const { sites, plans, now, world, feed, alerts, openAlerts, paused, actions, liveFlow } = useDemo();
  const s = orgStats(sites, plans, world.today);
  const [range, setRange] = useState<30 | 90>(30);
  const [rainOpen, setRainOpen] = useState(false);
  const [leakId, setLeakId] = useState<string | null>(null);
  const [factorSite, setFactorSite] = useState(sites[0].id);
  const series = lastNDays(sites, range);
  const flow = sites.reduce((a, x) => a + liveFlow(x.id), 0);
  const fsite = sites.find((x) => x.id === factorSite) ?? sites[0];
  const leak = alerts.find((a) => a.id === leakId) ?? null;
  const starts = sites.map((x) => plans[x.id]).filter((p) => p.watering > 0).map((p) => p.windowStart).sort();
  const pv = plans["pine-valley"];

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] text-mute">{longDate(now)} · Overview</span>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] sm:text-[34px]">
            {greeting(now)}, {ORG.user}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setRainOpen(true)}>
            <CloudRain size={16} /> Rain delay
          </Button>
          <Button
            onClick={() => {
              actions.setPaused(!paused);
              actions.toast({ title: paused ? "Autopilot resumed" : "All watering paused", body: paused ? "Tonight’s plans are back" : "Brook still watches for leaks", tone: "info" });
            }}
          >
            {paused ? <Play size={16} /> : <Pause size={16} />} {paused ? "Resume all" : "Pause all"}
          </Button>
          <ButtonLink href="/app/connect" variant="primary">
            <Plus size={16} /> Add site
          </ButtonLink>
        </div>
      </header>

      {openAlerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {openAlerts.map((a) => (
            <div key={a.id} className={clsx("flex animate-rise flex-wrap items-center gap-3 rounded-2xl border p-3.5 pl-4", a.severity === "high" ? "border-coral/35 bg-coral/10" : "border-amber/30 bg-amber/8")}>
              <AlertTriangle size={18} className={a.severity === "high" ? "text-coral" : "text-amber"} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-semibold">{a.title}</span>
                <span className="truncate text-xs text-soft">{sites.find((x) => x.id === a.siteId)?.name} · {a.body}</span>
              </span>
              {a.id.startsWith("leak") ? (
                <Button size="sm" variant="danger" onClick={() => setLeakId(a.id)}>Inspect</Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    actions.resolveAlert(a.id);
                    actions.toast({ title: "Crew ticket created", body: `${a.zoneId} probe battery swap`, tone: "good" });
                  }}
                >
                  Create ticket
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="flex flex-col gap-3.5 rounded-[1.5rem] bg-aqua p-6 text-aqua-deep">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Water budget left · {now.toLocaleString("en-GB", { month: "long" })}</span>
            <Pill tone="dark">{s.onPace ? `On pace · ${Math.round(s.paceDelta * 100)}% under` : "Over pace"}</Pill>
          </div>
          <div className="font-display text-[52px] leading-none font-bold tracking-[-0.04em]">
            <AnimatedNumber value={s.left} /> <span className="text-2xl">m³</span>
          </div>
          <span className="text-sm">of {fmt(s.budget)} m³ · resets in {s.daysLeft} day{s.daysLeft === 1 ? "" : "s"}</span>
          <div className="h-2 rounded-full bg-aqua-deep/18">
            <div className="h-full rounded-full bg-aqua-deep transition-[width] duration-700" style={{ width: `${Math.min(100, s.usedPct * 100)}%` }} />
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full border border-aqua-deep/30 px-2.5 py-1">{fmt(s.used)} m³ used</span>
            <span className="rounded-full border border-aqua-deep/30 px-2.5 py-1">Licence caps watched: 2</span>
          </div>
        </div>

        <Card className="flex flex-col gap-3.5 p-6">
          <span className="text-sm font-medium text-mute">Saved vs old schedule · this month</span>
          <div className="font-display text-[52px] leading-none font-bold tracking-[-0.04em] text-lime">
            <AnimatedNumber value={s.saved} /> <span className="text-2xl">m³</span>
          </div>
          <span className="text-sm text-soft">
            {eur(s.savedEur)} saved · {Math.round(s.savedPct * 100)}% under the fixed timers
          </span>
          <Sparkbars values={s.savingsSeries} className="mt-auto h-11" />
        </Card>

        <Card className="flex flex-col gap-3.5 p-6 md:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-mute">Autopilot tonight</span>
            <Switch
              on={!paused}
              label="Autopilot"
              onChange={(on) => {
                actions.setPaused(!on);
                actions.toast({ title: on ? "Autopilot resumed" : "All watering paused", tone: "info" });
              }}
            />
          </div>
          {paused ? (
            <>
              <div className="font-display text-[40px] leading-none font-bold tracking-[-0.02em] text-amber">Paused</div>
              <span className="text-sm leading-relaxed text-soft">No site waters tonight. Leak guard and frost alerts stay on.</span>
            </>
          ) : (
            <>
              <div className="font-display text-[40px] leading-none font-bold tracking-[-0.02em]">
                <AnimatedNumber value={s.tonightPlanned} /> <span className="text-xl">m³</span>
              </div>
              <span className="text-sm leading-relaxed text-soft">
                Watering {s.watering} of {s.zones} zones. The fixed timers would use {m3(s.tonightFixed)}.
                {pv.mode === "autopilot" && pv.rainTonight.prob >= 0.5 ? ` Rain is likely at Pine Valley overnight.` : ""}
              </span>
            </>
          )}
          <div className="mt-auto flex items-center justify-between text-sm">
            <span className="text-mute">{starts.length && !paused ? `First run ${starts[0]}` : "Nothing scheduled"}</span>
            <Link href="/app/sites/pine-valley" className="flex items-center gap-1 font-semibold text-aqua hover:text-[#a8eeff]">
              Review plan <ArrowRight size={15} />
            </Link>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4" aria-label="Live status">
        <Card className="flex items-center gap-3 rounded-2xl px-4 py-3.5">
          <LiveDot />
          <span className="flex flex-col">
            <span className="text-xs text-mute">Live network flow</span>
            <span className="font-display text-lg font-semibold">
              <AnimatedNumber value={flow} format={(n) => fmt1(n)} /> m³/h
            </span>
          </span>
        </Card>
        <Card className="flex items-center gap-3 rounded-2xl px-4 py-3.5">
          <Radio size={18} className="text-aqua" />
          <span className="flex flex-col">
            <span className="text-xs text-mute">Probes reporting</span>
            <span className="font-display text-lg font-semibold">{s.zones - openAlerts.filter((a) => a.id.startsWith("probe")).length} / {s.zones}</span>
          </span>
        </Card>
        <Card className="flex items-center gap-3 rounded-2xl px-4 py-3.5">
          <CloudRain size={18} className="text-aqua" />
          <span className="flex flex-col">
            <span className="text-xs text-mute">Forecast refresh</span>
            <span className="font-display text-lg font-semibold">every 15 min</span>
          </span>
        </Card>
        <Card className="flex items-center gap-3 rounded-2xl px-4 py-3.5">
          <AlertTriangle size={18} className={openAlerts.length ? "text-coral" : "text-lime"} />
          <span className="flex flex-col">
            <span className="text-xs text-mute">Open alerts</span>
            <span className="font-display text-lg font-semibold">{openAlerts.length || "None"}</span>
          </span>
        </Card>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="inputs">
        <SectionTitle id="inputs" aside={<span className="text-[13px] text-mute">Updated {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>}>
          What Autopilot is reading right now
        </SectionTitle>
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {sites.map((x) => (
            <button
              key={x.id}
              onClick={() => setFactorSite(x.id)}
              className={clsx(
                "flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm transition",
                x.id === factorSite ? "bg-fg font-semibold text-ink-950" : "bg-ink-850 text-soft ring-1 ring-ink-700 hover:bg-ink-800",
              )}
            >
              <SiteIcon type={x.type} size={15} /> {x.name}
            </button>
          ))}
        </div>
        <FactorGrid site={fsite} plan={plans[fsite.id]} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="flex min-w-0 flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Water used · all sites</h2>
            <div className="flex gap-1 rounded-xl bg-ink-950 p-1">
              {([30, 90] as const).map((r) => (
                <button key={r} onClick={() => setRange(r)} className={clsx("h-9 rounded-lg px-3.5 text-[13px]", range === r ? "bg-ink-700 font-semibold text-fg" : "text-mute hover:text-soft")}>
                  {r}D
                </button>
              ))}
            </div>
          </div>
          <UsageChart data={series} />
        </Card>
        <Card className="flex min-w-0 flex-col p-5 sm:p-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
              Autopilot activity <LiveDot />
            </h2>
            <Link href="/app/autopilot" className="text-sm font-semibold text-aqua">See all</Link>
          </div>
          <FeedList events={feed} limit={7} compact />
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle aside={<Link href="/app/connect" className="text-sm font-semibold text-aqua">Connect a controller →</Link>}>Sites</SectionTitle>
        <Card className="flex flex-col px-4 py-1 md:hidden">
          {sites.map((x) => {
            const p = plans[x.id];
            const alerts = openAlerts.filter((a) => a.siteId === x.id).length;
            return (
              <Link key={x.id} href={`/app/sites/${x.id}`} className="flex items-center gap-3 border-t border-ink-750 py-3.5 first:border-t-0">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ink-800 text-aqua"><SiteIcon type={x.type} /></span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate font-semibold">{x.name}</span>
                  <span className="truncate text-xs text-mute">{planSummary(p)}</span>
                </span>
                <ModePill plan={p} alerts={alerts} />
              </Link>
            );
          })}
        </Card>
        <Card className="hidden overflow-x-auto p-2 sm:p-3 md:block">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs text-mute">
                <th className="px-3 py-2.5 font-medium">Site</th>
                <th className="px-3 py-2.5 font-medium">Controller</th>
                <th className="px-3 py-2.5 text-right font-medium">Zones</th>
                <th className="px-3 py-2.5 font-medium">Tonight</th>
                <th className="px-3 py-2.5 font-medium">Month budget used</th>
                <th className="px-3 py-2.5 text-right font-medium">Saved this month</th>
                <th className="px-3 py-2.5 font-medium">Mode</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((x) => {
                const p = plans[x.id];
                const m = siteMonth(x, world.today);
                const alerts = openAlerts.filter((a) => a.siteId === x.id).length;
                return (
                  <tr key={x.id} className="border-t border-ink-750 transition-colors hover:bg-ink-800/50">
                    <td className="px-3 py-3.5">
                      <Link href={`/app/sites/${x.id}`} className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-ink-800 text-aqua"><SiteIcon type={x.type} /></span>
                        <span className="flex flex-col">
                          <span className="font-semibold">{x.name}</span>
                          <span className="text-xs text-mute">{x.typeLabel} · {x.city}, {x.country}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3.5 text-soft">{x.controller}</td>
                    <td className="px-3 py-3.5 text-right font-display tnum">{x.zones.length}</td>
                    <td className="px-3 py-3.5 text-soft">{planSummary(p)}</td>
                    <td className="px-3 py-3.5">
                      {x.monthBudgetM3 > 0 ? (
                        <span className="flex items-center gap-2.5">
                          <span className="h-1.5 w-32 rounded-full bg-ink-700">
                            <span className={clsx("block h-full rounded-full", m.budgetPct > 0.85 ? "bg-amber" : "bg-aqua")} style={{ width: `${Math.min(100, m.budgetPct * 100)}%` }} />
                          </span>
                          <span className="w-9 text-xs text-soft tnum">{Math.round(m.budgetPct * 100)}%</span>
                        </span>
                      ) : (
                        <span className="text-xs text-mute">Off season</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-right font-display tnum">{m.saved > 0 ? <span className="text-lime">{m3(m.saved)}</span> : <span className="text-mute">—</span>}</td>
                    <td className="px-3 py-3.5"><ModePill plan={p} alerts={alerts} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </section>

      <RainDelayModal open={rainOpen} onClose={() => setRainOpen(false)} />
      <LeakModal alert={leak} open={!!leak} onClose={() => setLeakId(null)} />
    </div>
  );
}

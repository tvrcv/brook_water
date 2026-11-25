"use client";

import clsx from "clsx";
import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useDemo } from "@/lib/demo/store";
import { ago } from "@/lib/format";
import { Button, Card, LiveDot, SectionTitle, Switch } from "@/components/ui";
import { FeedList, LeakModal } from "@/components/domain";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "good", label: "Savings" },
  { key: "alert", label: "Alerts" },
  { key: "info", label: "Updates" },
] as const;

const RULES = [
  { key: "cap", label: "Never exceed licence caps", sub: "Pine Valley 1,200 m³/day · Northwind 180 m³/day", locked: true },
  { key: "bans", label: "Follow local water restrictions", sub: "Restriction notices are checked every morning", locked: true },
  { key: "override", label: "Manual changes win for 24 hours", sub: "Autopilot won’t undo what your team just did", locked: false },
  { key: "frost", label: "Frost guard", sub: "No spray irrigation below 1 °C", locked: false },
  { key: "approve", label: "Ask before big changes", sub: "Plans more than 40% above the fixed schedule need approval", locked: false },
  { key: "leak", label: "Auto-hold suspected leaks", sub: "Hold the zone when flow runs 25% above its normal curve", locked: false },
];

export function AutopilotView() {
  const { feed, alerts, sites, actions, now } = useDemo();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [rules, setRules] = useState<Record<string, boolean>>(Object.fromEntries(RULES.map((r) => [r.key, true])));
  const [leakId, setLeakId] = useState<string | null>(null);
  const shown = filter === "all" ? feed : feed.filter((e) => e.tone === filter);
  const leak = alerts.find((a) => a.id === leakId) ?? null;

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-1.5">
        <span className="flex items-center gap-2 text-[13px] text-mute"><LiveDot /> Live</span>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em]">Autopilot</h1>
        <p className="max-w-2xl text-sm text-soft">Every decision Brook makes, with the reason behind it. Your guardrails always come first.</p>
      </header>

      <section id="alerts" className="flex scroll-mt-24 flex-col gap-3">
        <SectionTitle>Alerts</SectionTitle>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {alerts.map((a) => {
            const site = sites.find((s) => s.id === a.siteId);
            const open = a.status === "open";
            return (
              <Card key={a.id} className={clsx("flex flex-col gap-3 p-5", open && a.severity === "high" && "border-coral/40")}>
                <div className="flex items-start gap-3">
                  {open ? <AlertTriangle size={20} className={a.severity === "high" ? "text-coral" : "text-amber"} /> : <CheckCircle2 size={20} className="text-lime" />}
                  <span className="flex flex-1 flex-col gap-1">
                    <span className="font-semibold">{a.title}</span>
                    <span className="text-xs text-mute">{site?.name} · {ago(a.at, now)} · {open ? "Open" : "Resolved"}</span>
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-soft">{a.body}</p>
                {open && (
                  <div className="flex gap-2">
                    {a.id.startsWith("leak") ? (
                      <Button variant="danger" size="sm" onClick={() => setLeakId(a.id)}>Inspect</Button>
                    ) : (
                      <Button size="sm" onClick={() => { actions.resolveAlert(a.id); actions.toast({ title: "Crew ticket created", tone: "good" }); }}>Create ticket</Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => { actions.resolveAlert(a.id); actions.toast({ title: "Alert dismissed", tone: "info" }); }}>Dismiss</Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card className="flex min-w-0 flex-col gap-3 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Activity</h2>
            <div className="flex gap-1 rounded-xl bg-ink-950 p-1">
              {FILTERS.map((f) => (
                <button key={f.key} onClick={() => setFilter(f.key)} className={clsx("h-9 rounded-lg px-3 text-[13px]", filter === f.key ? "bg-ink-700 font-semibold text-fg" : "text-mute hover:text-soft")}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {shown.length ? <FeedList events={shown} /> : <p className="py-8 text-center text-sm text-mute">Nothing here yet.</p>}
        </Card>
        <Card className="flex h-fit flex-col p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold">Guardrails</h2>
          <p className="mt-1 mb-3 text-[13px] text-mute">Autopilot can only act inside these rules.</p>
          {RULES.map((r) => (
            <div key={r.key} className="flex items-center gap-3 border-t border-ink-750 py-3.5">
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-semibold">{r.label}</span>
                <span className="text-xs text-mute">{r.sub}</span>
              </span>
              {r.locked ? (
                <span className="text-xs font-semibold text-mute">Always on</span>
              ) : (
                <Switch size="sm" label={r.label} on={rules[r.key]} onChange={(on) => setRules((x) => ({ ...x, [r.key]: on }))} />
              )}
            </div>
          ))}
        </Card>
      </section>
      <LeakModal alert={leak} open={!!leak} onClose={() => setLeakId(null)} />
    </div>
  );
}

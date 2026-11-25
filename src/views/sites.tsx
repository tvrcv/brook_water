"use client";

import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { useDemo } from "@/lib/demo/store";
import { siteMonth, avgMoisture } from "@/lib/demo/stats";
import { fmt1, m3, timeIn } from "@/lib/format";
import { AnimatedNumber, ButtonLink, Card } from "@/components/ui";
import { ModePill, SiteIcon, planSummary } from "@/components/domain";
import { Sparkbars } from "@/components/charts";

export function SitesView() {
  const { sites, plans, openAlerts, world, liveFlow, now } = useDemo();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] text-mute">{sites.length} sites · {sites.reduce((a, s) => a + s.zones.length, 0)} zones</span>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.02em]">Sites</h1>
        </div>
        <ButtonLink href="/app/connect" variant="primary"><Plus size={16} /> Add site</ButtonLink>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sites.map((s, i) => {
          const p = plans[s.id];
          const m = siteMonth(s, world.today);
          const alerts = openAlerts.filter((a) => a.siteId === s.id).length;
          return (
            <Link key={s.id} href={`/app/sites/${s.id}`} className="group animate-rise" style={{ animationDelay: `${i * 50}ms` }}>
              <Card className="flex h-full flex-col gap-5 p-5 transition group-hover:border-ink-500 group-hover:bg-ink-800/60">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-ink-800 text-aqua"><SiteIcon type={s.type} size={22} /></span>
                  <ModePill plan={p} alerts={alerts} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-1.5 font-display text-xl font-semibold">
                    {s.name} <ArrowUpRight size={16} className="text-mute transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-aqua" />
                  </span>
                  <span className="text-[13px] text-mute">{s.typeLabel} · {s.city}, {s.country} · {timeIn(s.tz, now)} local</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-0.5 rounded-xl bg-ink-800 px-3 py-2.5">
                    <span className="text-[11px] text-mute">Zones</span>
                    <span className="font-display text-lg font-semibold">{s.zones.length}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 rounded-xl bg-ink-800 px-3 py-2.5">
                    <span className="text-[11px] text-mute">Soil avg</span>
                    <span className="font-display text-lg font-semibold">{avgMoisture(s)}%</span>
                  </div>
                  <div className="flex flex-col gap-0.5 rounded-xl bg-ink-800 px-3 py-2.5">
                    <span className="text-[11px] text-mute">Flow now</span>
                    <span className="font-display text-lg font-semibold"><AnimatedNumber value={liveFlow(s.id)} format={(n) => fmt1(n)} /></span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 text-sm">
                  <span className="flex justify-between"><span className="text-mute">Tonight</span><span className="font-medium">{planSummary(p)}</span></span>
                  <span className="flex justify-between"><span className="text-mute">Saved this month</span><span className="font-medium text-lime">{m.saved > 0 ? m3(m.saved) : "—"}</span></span>
                  <span className="flex justify-between"><span className="text-mute">Controller</span><span className="font-medium text-soft">{s.controller}</span></span>
                </div>
                <Sparkbars values={s.usage.slice(-30).map((u) => u.used)} color="bg-aqua" className="mt-auto h-10" />
              </Card>
            </Link>
          );
        })}
        <Link href="/app/connect" className="group">
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-dashed border-ink-600 text-mute transition group-hover:border-aqua group-hover:text-aqua">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-ink-850"><Plus size={22} /></span>
            <span className="font-display text-lg font-semibold">Connect a new site</span>
            <span className="text-[13px]">Rain Bird, Toro, Hunter, Modbus and more</span>
          </div>
        </Link>
      </div>
    </div>
  );
}

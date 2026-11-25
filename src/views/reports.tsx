"use client";

import { Download, FileText, ShieldCheck } from "lucide-react";
import { useDemo } from "@/lib/demo/store";
import { lastNDays } from "@/lib/demo/generate";
import { orgStats, siteMonth } from "@/lib/demo/stats";
import { ORG } from "@/lib/demo/catalog";
import { eur, fmt, m3 } from "@/lib/format";
import { Button, Card } from "@/components/ui";
import { UsageChart } from "@/components/charts";
import { SiteIcon } from "@/components/domain";

export function ReportsView() {
  const { sites, plans, world } = useDemo();
  const s = orgStats(sites, plans, world.today);
  const month = world.today.toLocaleString("en-GB", { month: "long", year: "numeric" });
  const rows = sites.map((x) => {
    const m = siteMonth(x, world.today);
    const days = x.usage.filter((u) => u.date.getMonth() === world.today.getMonth());
    const peak = Math.max(0, ...days.map((d) => d.used));
    return { site: x, ...m, savedEur: m.saved * x.pricePerM3, peak, capOk: !x.dailyCapM3 || peak <= x.dailyCapM3 };
  });
  const capped = rows.filter((r) => r.site.dailyCapM3);

  const csv = () => {
    const head = "site,city,used_m3,old_schedule_m3,saved_m3,saved_eur,budget_m3,peak_day_m3,daily_cap_m3";
    const lines = rows.map((r) => [r.site.name, r.site.city, r.used, r.fixed, r.saved, Math.round(r.savedEur), r.site.monthBudgetM3, r.peak, r.site.dailyCapM3 ?? ""].join(","));
    const blob = new Blob([[head, ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `brook-report-${world.today.toISOString().slice(0, 7)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] text-mute">{ORG.name} · month to date</span>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.02em]">Water report · {month}</h1>
        </div>
        <div className="no-print flex gap-2">
          <Button onClick={csv}><Download size={16} /> CSV</Button>
          <Button variant="primary" onClick={() => window.print()}><FileText size={16} /> Save as PDF</Button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Water used", value: m3(s.used), sub: `${Math.round(s.usedPct * 100)}% of ${fmt(s.budget)} m³ budget` },
          { label: "Old fixed schedule", value: m3(s.fixed), sub: "Same days, timers only" },
          { label: "Water saved", value: m3(s.saved), sub: `${Math.round(s.savedPct * 100)}% less`, lime: true },
          { label: "Money saved", value: eur(s.savedEur), sub: "At each site’s water price", lime: true },
        ].map((k) => (
          <Card key={k.label} className="flex flex-col gap-1.5 rounded-[1.25rem] px-5 py-4">
            <span className="text-xs text-mute">{k.label}</span>
            <span className={`font-display text-[28px] font-bold tracking-[-0.02em] ${k.lime ? "text-lime" : ""}`}>{k.value}</span>
            <span className="text-xs text-soft">{k.sub}</span>
          </Card>
        ))}
      </section>

      <Card className="flex items-start gap-4 border-lime/30 p-5">
        <ShieldCheck size={22} className="mt-0.5 shrink-0 text-lime" />
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{capped.every((r) => r.capOk) ? "All licensed sources stayed inside their daily caps." : "A daily cap was exceeded this month."}</span>
          <span className="text-sm text-soft">
            {capped.map((r) => `${r.site.name}: peak ${fmt(r.peak)} of ${fmt(r.site.dailyCapM3!)} m³/day`).join(" · ")}. Daily readings are kept for 7 years for audits.
          </span>
        </div>
      </Card>

      <Card className="overflow-x-auto p-2 sm:p-3">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs text-mute">
              <th className="px-3 py-2.5 font-medium">Site</th>
              <th className="px-3 py-2.5 text-right font-medium">Used</th>
              <th className="px-3 py-2.5 text-right font-medium">Old schedule</th>
              <th className="px-3 py-2.5 text-right font-medium">Saved</th>
              <th className="px-3 py-2.5 text-right font-medium">Saved €</th>
              <th className="px-3 py-2.5 text-right font-medium">Budget</th>
              <th className="px-3 py-2.5 text-right font-medium">Peak day / cap</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.site.id} className="border-t border-ink-750">
                <td className="px-3 py-3.5">
                  <span className="flex items-center gap-2.5"><SiteIcon type={r.site.type} className="text-aqua" /><span className="font-semibold">{r.site.name}</span></span>
                </td>
                <td className="px-3 py-3.5 text-right font-display tnum">{r.used ? m3(r.used) : "—"}</td>
                <td className="px-3 py-3.5 text-right font-display text-soft tnum">{r.fixed ? m3(r.fixed) : "—"}</td>
                <td className="px-3 py-3.5 text-right font-display text-lime tnum">{r.saved ? m3(r.saved) : "—"}</td>
                <td className="px-3 py-3.5 text-right font-display tnum">{r.saved ? eur(r.savedEur) : "—"}</td>
                <td className="px-3 py-3.5 text-right text-soft tnum">{r.site.monthBudgetM3 ? `${Math.round(r.budgetPct * 100)}%` : "Off season"}</td>
                <td className="px-3 py-3.5 text-right text-soft tnum">{r.site.dailyCapM3 ? `${fmt(r.peak)} / ${fmt(r.site.dailyCapM3)} m³` : "No cap"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="flex flex-col gap-4 p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold">Last 90 days · all sites</h2>
        <UsageChart data={lastNDays(sites, 90)} height={200} />
      </Card>
    </div>
  );
}

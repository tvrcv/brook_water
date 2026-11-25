"use client";

import { use, useMemo } from "react";
import { browser } from "react-dom";
import { buildWorld } from "@/lib/demo/generate";
import { planFor } from "@/lib/demo/engine";
import { m3 } from "@/lib/format";
import { FeedIcon } from "@/components/ui";

/** A live slice of the real engine: tonight's plan at the demo golf course. */
export function HeroDemo() {
  use(browser("Tonight's plan is computed for the visitor's date."));
  const { plan, site } = useMemo(() => {
    const world = buildWorld(new Date());
    const site = world.sites.find((s) => s.id === "pine-valley")!;
    return { site, plan: planFor(site) };
  }, []);
  const saved = Math.max(0, plan.fixedM3 - plan.plannedM3);
  return <HeroCards title={`Saved tonight · ${site.name.replace(" Golf Club", "")}`} saved={m3(saved)} pct={plan.fixedM3 ? Math.round((saved / plan.fixedM3) * 100) : 0} rows={plan.reasons.slice(0, 3).map((r) => ({ title: r.label, why: r.why, amount: r.m3 >= 0 ? `−${m3(r.m3)}` : `+${m3(-r.m3)}`, key: r.key }))} />;
}

export function HeroCards({
  title,
  saved,
  pct,
  rows,
}: {
  title: string;
  saved: string;
  pct: number;
  rows: { title: string; why: string; amount: string; key: string }[];
}) {
  return (
    <div className="flex w-full max-w-[440px] flex-col gap-3">
      <div className="flex animate-rise flex-col gap-2.5 rounded-[1.75rem] bg-aqua p-7 text-aqua-deep shadow-[0_30px_80px_-20px_rgb(92_225_255/0.35)]">
        <span className="text-sm font-semibold">{title}</span>
        <span className="font-display text-6xl leading-none font-bold tracking-[-0.045em]">{saved}</span>
        <span className="text-sm">{pct}% less than the fixed timer schedule</span>
      </div>
      <div className="animate-rise rounded-[1.4rem] border border-ink-700 bg-ink-850 px-5 py-2 [animation-delay:120ms]">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center gap-3 border-t border-ink-750 py-3 first:border-t-0">
            <FeedIcon icon={r.key === "rain" ? "rain" : r.key === "leak" ? "alert" : r.key === "moist" ? "drop" : "bolt"} tone={r.key === "leak" ? "alert" : "good"} size={36} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-semibold">{r.title}</span>
              <span className="truncate text-xs text-mute">{r.why}</span>
            </span>
            <span className={`font-display font-semibold tnum ${r.key === "leak" ? "text-coral" : "text-lime"}`}>{r.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

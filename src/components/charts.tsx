"use client";

import clsx from "clsx";
import { useState } from "react";
import { CloudRain, Sun, CloudSun, Snowflake } from "lucide-react";
import { fmt, shortDate, weekday } from "@/lib/format";
import type { DayWeather } from "@/lib/demo/types";

export function UsageChart({
  data,
  height = 220,
}: {
  data: { date: Date; used: number; fixed: number; rainy: boolean }[];
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => Math.max(d.used, d.fixed))) * 1.08;
  const h = (v: number) => (v / max) * height;
  const labels = [0, Math.floor(data.length / 4), Math.floor(data.length / 2), Math.floor((3 * data.length) / 4), data.length - 1];
  const sel = hover ?? data.length - 1;
  const d = data[sel];
  const gap = data.length > 60 ? 1 : 4;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-[44px] flex-wrap items-end gap-x-6 gap-y-1 text-sm">
        <span className="text-mute">{hover === null ? "Today" : shortDate(d.date)}</span>
        <span>
          <span className="font-display text-lg font-semibold tnum">{fmt(d.used)} m³</span> <span className="text-mute">used</span>
        </span>
        <span>
          <span className="font-display text-lg font-semibold text-soft tnum">{fmt(d.fixed)} m³</span> <span className="text-mute">old schedule</span>
        </span>
        {d.fixed > 0 && (
          <span className={clsx("font-display text-lg font-semibold tnum", d.used <= d.fixed ? "text-lime" : "text-amber")}>
            {d.used <= d.fixed ? "−" : "+"}
            {Math.abs(Math.round((1 - d.used / d.fixed) * 100))}%
          </span>
        )}
      </div>
      <div
        role="img"
        aria-label={`Daily water use for the last ${data.length} days, compared with the old fixed schedule`}
        className="relative flex items-end border-b border-ink-700"
        style={{ height, gap }}
        onMouseLeave={() => setHover(null)}
      >
        {data.map((p, i) => (
          <div
            key={i}
            className="relative h-full flex-1"
            onMouseEnter={() => setHover(i)}
            onTouchStart={() => setHover(i)}
          >
            <div
              className={clsx(
                "absolute inset-x-0 bottom-0 rounded-t-[4px] transition-[height,background-color] duration-500",
                p.rainy ? "bg-ink-500" : "bg-aqua",
                hover !== null && hover !== i && "opacity-45",
              )}
              style={{ height: h(p.used) }}
            />
            {p.fixed > 0 && (
              <div className="absolute -inset-x-px h-0.5 bg-amber transition-[bottom] duration-500" style={{ bottom: h(p.fixed) }} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-mute">
        {labels.map((i, k) => (
          <span key={k}>{k === labels.length - 1 ? "Today" : shortDate(data[i].date)}</span>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-soft">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-aqua" />Used</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-ink-500" />Rainy day</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 bg-amber" />Old fixed schedule</span>
      </div>
    </div>
  );
}

export function Sparkbars({ values, className, color = "bg-lime" }: { values: number[]; className?: string; color?: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className={clsx("flex items-end gap-1", className)} aria-hidden>
      {values.map((v, i) => (
        <div key={i} className={clsx("flex-1 rounded-[3px] opacity-85", color)} style={{ height: `${Math.max(6, (v / max) * 100)}%` }} />
      ))}
    </div>
  );
}

function wxIcon(w: DayWeather) {
  if (w.tMin <= 0) return Snowflake;
  if (w.rainProb >= 0.5 && w.rainMm > 0) return CloudRain;
  if (w.humidity > 78) return CloudSun;
  return Sun;
}

export function ForecastStrip({ days }: { days: DayWeather[] }) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((w, i) => {
        const I = wxIcon(w);
        const wet = w.rainProb >= 0.5 && w.rainMm > 0;
        return (
          <div key={i} className={clsx("flex flex-col items-center gap-1.5 rounded-2xl px-1 py-3", i === 0 ? "bg-ink-750" : "bg-ink-800/60")}>
            <span className="text-xs text-mute">{i === 0 ? "Today" : weekday(w.date)}</span>
            <I size={20} className={wet ? "text-aqua" : w.tMin <= 0 ? "text-peri" : "text-amber"} aria-hidden />
            <span className="text-sm font-semibold tnum">{Math.round(w.tMax)}°</span>
            <span className="text-[11px] text-mute tnum">{wet ? `${w.rainMm} mm` : `ET ${w.et0}`}</span>
          </div>
        );
      })}
    </div>
  );
}

export function MoistureBars({ values, band }: { values: number[]; band: [number, number] }) {
  const max = 40;
  return (
    <div className="flex flex-col gap-2">
      <div role="img" aria-label="Soil moisture over the last 7 days" className="relative flex h-24 items-end gap-2">
        <div
          className="absolute inset-x-0 rounded bg-aqua/8 border-y border-dashed border-aqua/30"
          style={{ bottom: `${(band[0] / max) * 100}%`, height: `${((band[1] - band[0]) / max) * 100}%` }}
        />
        {values.map((v, i) => (
          <div key={i} className="relative flex-1 rounded-t-md bg-aqua/80" style={{ height: `${(v / max) * 100}%` }} />
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-mute">
        {values.map((_, i) => (
          <span key={i}>{i === values.length - 1 ? "Now" : `−${values.length - 1 - i}d`}</span>
        ))}
      </div>
    </div>
  );
}

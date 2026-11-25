"use client";

import clsx from "clsx";
import { useState } from "react";
import { eur, fmt } from "@/lib/format";

const TYPES = [
  { key: "golf", label: "Golf course", use: 200_000, price: 0.9 },
  { key: "stadium", label: "Stadium or sports pitch", use: 15_000, price: 2.5 },
  { key: "industrial", label: "Factory or industrial site", use: 30_000, price: 1.2 },
  { key: "station", label: "Station or transit hub", use: 4_000, price: 2.5 },
  { key: "campus", label: "Campus, park or resort", use: 25_000, price: 2.2 },
] as const;

export function RoiCalculator() {
  const [type, setType] = useState<(typeof TYPES)[number]["key"]>("golf");
  const t = TYPES.find((x) => x.key === type)!;
  const [use, setUse] = useState<number>(t.use);
  const [price, setPrice] = useState<number>(t.price);
  const [cut, setCut] = useState(20);

  const pick = (k: (typeof TYPES)[number]["key"]) => {
    const n = TYPES.find((x) => x.key === k)!;
    setType(k);
    setUse(n.use);
    setPrice(n.price);
  };

  const savedM3 = (use * cut) / 100;
  const savedEur = savedM3 * price;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="card flex flex-col gap-6 p-6 sm:p-8">
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-sm font-semibold">Type of site</legend>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((x) => (
              <button
                type="button"
                key={x.key}
                onClick={() => pick(x.key)}
                aria-pressed={type === x.key}
                className={clsx("h-10 rounded-full px-4 text-sm transition", type === x.key ? "bg-fg font-semibold text-ink-950" : "bg-ink-800 text-soft hover:bg-ink-700")}
              >
                {x.label}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Water used per year (m³)
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={use}
              onChange={(e) => setUse(Math.max(0, Number(e.target.value)))}
              className="h-12 w-full min-w-0 rounded-xl border border-ink-700 bg-ink-900 px-4 font-display text-lg font-semibold outline-none focus:border-aqua"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Price per m³ (€)
            <input
              type="number"
              inputMode="decimal"
              step={0.1}
              min={0}
              value={price}
              onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
              className="h-12 w-full min-w-0 rounded-xl border border-ink-700 bg-ink-900 px-4 font-display text-lg font-semibold outline-none focus:border-aqua"
            />
          </label>
        </div>
        <label className="flex flex-col gap-3 text-sm font-semibold">
          <span className="flex justify-between">
            Water you expect to cut <span className="font-display text-aqua">{cut}%</span>
          </span>
          <input type="range" min={5} max={40} value={cut} onChange={(e) => setCut(Number(e.target.value))} className="accent-[var(--color-aqua)]" />
          <span className="text-xs font-normal text-mute">Move this to match your own assumption. Savings depend on climate, how your timers are set today and the state of the system.</span>
        </label>
      </div>
      <div className="flex flex-col justify-between gap-6 rounded-[1.5rem] bg-lime p-6 text-[#0e1404] sm:p-8">
        <span className="text-sm font-semibold">Your estimate, per year</span>
        <div className="flex flex-col gap-1">
          <span className="font-display text-6xl leading-none font-bold tracking-[-0.045em] tnum">{eur(savedEur)}</span>
          <span className="text-base">back in your budget</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-black/8 p-4">
            <div className="font-display text-2xl font-bold tnum">{fmt(savedM3)} m³</div>
            <div className="text-xs">water not used</div>
          </div>
          <div className="rounded-2xl bg-black/8 p-4">
            <div className="font-display text-2xl font-bold tnum">{fmt(savedM3 / 2500)}</div>
            <div className="text-xs">Olympic pools</div>
          </div>
        </div>
        <a href="#contact" className="flex h-12 items-center justify-center rounded-full bg-[#0e1404] font-semibold text-lime transition hover:brightness-125">
          Check this on your own site →
        </a>
      </div>
    </div>
  );
}

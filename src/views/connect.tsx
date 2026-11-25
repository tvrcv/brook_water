"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { useDemo } from "@/lib/demo/store";
import { Button, Card, Modal, Switch } from "@/components/ui";

type Status = "on" | "add" | "auto";
const SECTIONS: { title: string; sub: string; items: [string, string, string, Status][] }[] = [
  {
    title: "Irrigation controllers",
    sub: "Golf central control, commercial landscape and building systems",
    items: [
      ["RB", "Rain Bird", "CirrusPRO · IC System", "on"],
      ["TO", "Toro", "Lynx central control", "on"],
      ["HU", "Hunter", "Pilot · ACC2 · Centralus", "on"],
      ["NE", "Netafim", "Drip and greenhouse", "add"],
      ["MB", "Modbus / BACnet", "Factories, stations, building systems", "on"],
      ["BE", "Brook Edge", "Relay box for older controllers", "on"],
    ],
  },
  {
    title: "Sensors and meters",
    sub: "The more Brook can measure, the less it has to guess",
    items: [
      ["SM", "Soil moisture probes", "Moisture, salinity, temperature", "on"],
      ["FL", "Flow meters", "Per-line flow for leak detection", "on"],
      ["PS", "Pump stations", "Pressure, power, run-hours", "on"],
      ["WS", "On-site weather station", "Rain, wind, solar, humidity", "add"],
      ["WM", "Utility smart meter", "Billed water, hour by hour", "add"],
      ["LV", "Reservoir and tank level", "Ponds, tanks, rain capture", "add"],
    ],
  },
  {
    title: "Outside data",
    sub: "Switched on for every site, nothing to install",
    items: [
      ["FC", "Local forecast", "Rain, ET and frost, 10 days ahead", "auto"],
      ["SA", "Satellite turf health", "Weekly plant-stress maps", "auto"],
      ["EN", "Energy tariffs", "Run pumps when power is cheap", "auto"],
      ["RS", "Restrictions and licences", "Bans, caps, permit rules", "auto"],
      ["CA", "Event calendar", "Matches, tournaments, cleaning", "add"],
      ["DL", "Daylight and sun angle", "Shade, sunrise, sunset", "auto"],
    ],
  },
];

const PERMS = [
  ["read", "Read schedules and flows", "Needed for reports and leak alerts", true],
  ["runtimes", "Adjust run-times", "Shorten or lengthen existing programs", true],
  ["startstop", "Skip, start and stop zones", "Rain skips, leak holds, frost guard", true],
  ["newprog", "Create new programs", "Off: Autopilot only edits what you built", false],
  ["estop", "Emergency shut-off", "Close the master valve on a burst pipe", true],
] as const;

export function ConnectView() {
  const { actions } = useDemo();
  const [perms, setPerms] = useState<Record<string, boolean>>(Object.fromEntries(PERMS.map(([k, , , v]) => [k, v])));
  const [req, setReq] = useState<string | null>(null);
  const [requested, setRequested] = useState<string[]>([]);

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Link href="/app" className="text-[13px] font-semibold text-aqua">← Overview</Link>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.02em]">Connect a site</h1>
          <p className="text-sm text-soft">Plug Brook into the controller you already own. No new pipes, no rip-and-replace.</p>
        </div>
        <ol aria-label="Setup steps" className="flex flex-wrap gap-2">
          {["Controller", "Sensors & data", "Limits & rules", "Go live"].map((s, i) => (
            <li key={s} className={clsx("flex items-center gap-2 rounded-full border py-1.5 pr-3.5 pl-1.5 text-[13px]", i === 1 ? "border-aqua bg-ink-800 font-semibold" : "border-ink-700 bg-ink-850", i > 1 && "text-mute")}>
              <span className={clsx("flex size-6 items-center justify-center rounded-full text-xs", i === 0 ? "bg-lime text-[#0e1404]" : i === 1 ? "bg-aqua text-aqua-deep" : "bg-ink-700")}>
                {i === 0 ? <Check size={14} strokeWidth={3} /> : i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </header>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-7">
          {SECTIONS.map((sec) => (
            <section key={sec.title} className="flex flex-col gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold">{sec.title}</h2>
                <p className="text-[13px] text-mute">{sec.sub}</p>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 2xl:grid-cols-3">
                {sec.items.map(([mono, name, sub, st]) => {
                  const done = st === "on" || requested.includes(name);
                  return (
                    <Card key={name} className={clsx("flex items-center gap-3 rounded-2xl p-3.5", st === "on" && "border-lime/30")}>
                      <span className={clsx("flex size-11 shrink-0 items-center justify-center rounded-xl font-display text-[15px] font-bold", st === "on" ? "bg-[#1e3a2a] text-lime" : "bg-ink-800 text-soft")}>{mono}</span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-sm font-semibold">{name}</span>
                        <span className="truncate text-xs text-mute">{sub}</span>
                      </span>
                      {st === "auto" ? (
                        <span className="rounded-full bg-ink-700 px-2.5 py-1 text-xs font-semibold text-soft">Built in</span>
                      ) : done ? (
                        <span className="rounded-full bg-lime/15 px-2.5 py-1 text-xs font-semibold text-lime">{st === "on" ? "Connected" : "Requested"}</span>
                      ) : (
                        <button onClick={() => setReq(name)} className="rounded-full bg-aqua/15 px-3 py-1.5 text-xs font-semibold text-aqua hover:bg-aqua/25">Connect</button>
                      )}
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <Card className="flex h-fit flex-col gap-5 p-6 xl:sticky xl:top-6">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[#1e3a2a] font-display font-bold text-lime">RB</span>
            <span className="flex flex-col">
              <span className="font-display text-xl font-semibold">Rain Bird CirrusPRO</span>
              <span className="text-[13px] text-lime">Connected · 64 zones found · 2 pump stations</span>
            </span>
          </div>
          <p className="text-sm leading-relaxed text-soft">Choose what Brook may do. Autopilot never goes beyond these permissions, and every change shows up in the activity log.</p>
          <div className="flex flex-col">
            {PERMS.map(([k, label, sub]) => (
              <div key={k} className="flex items-center gap-3 border-t border-ink-750 py-3">
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-xs text-mute">{sub}</span>
                </span>
                <Switch size="sm" label={label} on={perms[k]} onChange={(on) => setPerms((p) => ({ ...p, [k]: on }))} />
              </div>
            ))}
          </div>
          <div className="flex gap-3 rounded-2xl bg-ink-800 p-4">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-lime" />
            <span className="text-[13px] leading-relaxed text-soft">Always on: licence caps, local bans, and manual overrides that win for 24 hours.</span>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => actions.toast({ title: "Saved for later", tone: "info" })}>Save for later</Button>
            <Button variant="primary" className="flex-1" onClick={() => actions.toast({ title: "Permissions saved", body: "Next: limits and rules", tone: "good" })}>Continue</Button>
          </div>
        </Card>
      </div>

      <Modal open={!!req} onClose={() => setReq(null)} title={`Connect ${req ?? ""}`}>
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-soft">
            In the live product you sign in to {req} here and pick the sites to share. In this demo, we’ll mark it as requested.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              if (req) setRequested((r) => [...r, req]);
              actions.toast({ title: `${req} requested`, body: "Our team will set it up with you", tone: "good" });
              setReq(null);
            }}
          >
            Request connection
          </Button>
        </div>
      </Modal>
    </div>
  );
}

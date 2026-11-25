import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CloudRain,
  Droplets,
  Factory,
  Flag,
  Gauge,
  Hand,
  ListChecks,
  Lock,
  Moon,
  Plug,
  ShieldCheck,
  Snowflake,
  Sun,
  Thermometer,
  TrainFront,
  Trees,
  Trophy,
  Wind,
  Zap,
  Euro,
  FileCheck2,
} from "lucide-react";
import { Logo } from "@/components/ui";
import { HeroCards, HeroDemo } from "@/components/landing/hero-demo";
import { RoiCalculator } from "@/components/landing/roi";
import { ContactForm } from "@/components/landing/contact";

const INPUTS = [
  { icon: CloudRain, label: "Rain forecast" },
  { icon: Sun, label: "Evaporation (ET)" },
  { icon: Droplets, label: "Soil moisture" },
  { icon: Thermometer, label: "Temperature & frost" },
  { icon: Wind, label: "Wind & drift" },
  { icon: Moon, label: "Daylight hours" },
  { icon: Gauge, label: "Flow & pressure" },
  { icon: Euro, label: "Water price" },
  { icon: Zap, label: "Power tariffs" },
  { icon: FileCheck2, label: "Licences & bans" },
  { icon: CalendarClock, label: "Events & matches" },
  { icon: Snowflake, label: "Winter mode" },
];

const INDUSTRIES = [
  { icon: Flag, title: "Golf courses", body: "Greens firm, fairways green. Every zone watered to its own soil reading, not the clock." },
  { icon: Trophy, title: "Stadiums & sports turf", body: "Plans around kick-off, mowing and grow lights so the pitch peaks on match day." },
  { icon: Factory, title: "Factories & yards", body: "Landscaping and dust suppression under one water budget, inside your licence." },
  { icon: TrainFront, title: "Stations & transit", body: "Green roofs and planters looked after across hundreds of small sites, from one screen." },
  { icon: Trees, title: "Parks & campuses", body: "Drought rules and watering days applied automatically, with a report for the council." },
  { icon: Building2, title: "Hotels & resorts", body: "Lush grounds for guests and a water bill your finance team can predict." },
];

export default function Home() {
  return (
    <div className="relative overflow-x-clip">
      <div aria-hidden className="pointer-events-none absolute top-[-200px] left-1/2 h-[600px] w-[1100px] -translate-x-1/2 rounded-full bg-aqua/10 blur-[120px]" />

      <header className="sticky top-0 z-40 border-b border-transparent bg-ink-950/70 backdrop-blur-xl">
        <nav aria-label="Site" className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" aria-label="Brook home"><Logo /></Link>
          <div className="hidden gap-8 text-sm text-soft md:flex">
            <a href="#how" className="hover:text-fg">How it works</a>
            <a href="#industries" className="hover:text-fg">Industries</a>
            <a href="#roi" className="hover:text-fg">Savings</a>
            <a href="#trust" className="hover:text-fg">Control</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/app" className="hidden h-11 items-center rounded-full px-4 text-sm font-medium text-fg hover:bg-ink-800 sm:flex">Live demo</Link>
            <a href="#contact" className="flex h-11 items-center rounded-full bg-fg px-5 text-sm font-semibold text-ink-950 transition hover:bg-white">Book a demo</a>
          </div>
        </nav>
      </header>

      <main className="relative mx-auto flex max-w-[1240px] flex-col gap-28 px-5 pt-10 pb-16 sm:gap-36 sm:px-8 sm:pt-16">
        <section className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-7">
            <span className="w-fit rounded-full border border-ink-700 bg-ink-900/60 px-3.5 py-1.5 text-[13px] font-semibold text-aqua">Water on autopilot</span>
            <h1 className="font-display text-[52px] leading-[0.95] font-bold tracking-[-0.05em] sm:text-7xl lg:text-[84px]">
              Stop watering
              <br />
              on a timer.
            </h1>
            <p className="max-w-[540px] text-lg leading-relaxed text-soft sm:text-xl">
              Brook plugs into the irrigation system you already have and decides, every night, how much water each zone really needs. It reads the forecast, the soil, the sun and your water licence.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/app" className="group flex h-14 items-center gap-2 rounded-full bg-aqua px-7 font-semibold text-aqua-deep transition hover:brightness-110">
                Open the live demo <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
              </Link>
              <a href="#contact" className="flex h-14 items-center rounded-full border border-ink-600 px-7 font-semibold transition hover:bg-ink-850">Book a demo</a>
            </div>
            <p className="text-[13px] text-mute">Works with Rain Bird · Toro · Hunter · Netafim · Modbus · BACnet · and older controllers through Brook Edge</p>
          </div>
          <div className="flex min-w-0 justify-center lg:justify-end">
            <Suspense
              fallback={
                <HeroCards
                  title="Saved tonight · Pine Valley"
                  saved="—"
                  pct={0}
                  rows={[
                    { key: "rain", title: "Rain on the way", why: "Fairways skipped", amount: "" },
                    { key: "moist", title: "Soil already moist", why: "Zones in band", amount: "" },
                    { key: "leak", title: "Possible leak", why: "Zone held for a flow check", amount: "" },
                  ]}
                />
              }
            >
              <HeroDemo />
            </Suspense>
          </div>
        </section>

        <section className="flex flex-col gap-8" aria-labelledby="reads">
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 id="reads" className="font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Twelve signals. One decision a night.</h2>
            <p className="text-lg text-soft">A timer only knows the clock. Brook weighs everything that changes how much water a zone needs, and explains each call in plain words.</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {INPUTS.map(({ icon: I, label }) => (
              <div key={label} className="flex flex-col gap-3 rounded-2xl border border-ink-700 bg-ink-850 p-4">
                <I size={20} className="text-aqua" aria-hidden />
                <span className="text-sm font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="flex scroll-mt-24 flex-col gap-6">
          <h2 className="font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">What it does for you</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="card flex flex-col gap-5 p-7">
              <div className="flex flex-col gap-3 rounded-2xl bg-ink-800 p-4">
                {[["Rain on the way", 92, "bg-lime"], ["Soil already moist", 48, "bg-aqua"], ["Low evaporation", 22, "bg-peri"]].map(([l, w, c]) => (
                  <div key={l as string} className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold">{l}</span>
                    <span className="h-2 rounded-full bg-ink-700"><span className={`block h-full rounded-full ${c}`} style={{ width: `${w}%` }} /></span>
                  </div>
                ))}
              </div>
              <h3 className="font-display text-2xl font-semibold">Explains every decision</h3>
              <p className="text-soft">Every skip and every trim comes with its reason, so your greenkeeper or facility manager can trust it — and overrule it.</p>
            </div>
            <div className="card flex flex-col gap-5 p-7">
              <div className="rounded-2xl bg-ink-800 p-4">
                <svg viewBox="0 0 240 70" className="h-20 w-full" aria-hidden>
                  <polyline fill="none" stroke="var(--color-mute)" strokeWidth="1.5" strokeDasharray="4 3" points="2,62 40,60 80,62 120,61 160,62 200,60 238,61" />
                  <polyline fill="none" stroke="var(--color-coral)" strokeWidth="2.5" points="2,62 40,61 80,62 110,60 130,18 160,12 200,10 238,12" />
                </svg>
                <span className="text-xs font-semibold text-coral">Flow 38% over normal · zone held</span>
              </div>
              <h3 className="font-display text-2xl font-semibold">Catches leaks in minutes</h3>
              <p className="text-soft">Brook learns each line’s normal flow. When a pipe bursts at 2 a.m., the zone is held and you get a push — not a surprise bill.</p>
            </div>
            <div className="card flex flex-col gap-5 p-7">
              <div className="flex flex-col gap-2 rounded-2xl bg-ink-800 p-4 text-sm">
                <span className="flex justify-between"><span className="text-mute">Licence cap</span><span className="font-semibold">1,200 m³/day</span></span>
                <span className="flex justify-between"><span className="text-mute">Peak day this month</span><span className="font-semibold">Inside cap</span></span>
                <span className="flex items-center gap-1.5 font-semibold text-lime"><ShieldCheck size={14} /> Report ready</span>
              </div>
              <h3 className="font-display text-2xl font-semibold">Proves compliance</h3>
              <p className="text-soft">Daily readings, caps and bans in one report, ready for the water authority, your board or your sustainability audit.</p>
            </div>
          </div>
        </section>

        <section id="industries" className="flex scroll-mt-24 flex-col gap-8">
          <h2 className="max-w-3xl font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Anywhere grass, plants or yards drink water.</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INDUSTRIES.map(({ icon: I, title, body }) => (
              <div key={title} className="card flex flex-col gap-3 p-6">
                <span className="flex size-11 items-center justify-center rounded-xl bg-ink-800"><I size={22} className="text-aqua" aria-hidden /></span>
                <h3 className="font-display text-xl font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-soft">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-8">
          <h2 className="font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Live in three steps</h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {[
              [Plug, "Connect", "Link your controller, sensors and meters. Older systems get a Brook Edge relay box."],
              [ListChecks, "Set your limits", "Budgets, licence caps, local bans and what Autopilot may change. You stay in charge."],
              [Gauge, "Let it run", "Approve plans from your phone, catch leaks early and export reports in one tap."],
            ].map(([I, t, b], i) => {
              const Icon = I as typeof Plug;
              return (
                <li key={t as string} className={`flex flex-col gap-3 border-t-2 pt-5 ${i === 0 ? "border-aqua" : "border-ink-600"}`}>
                  <span className="flex items-center gap-3 font-display text-sm font-semibold text-aqua"><Icon size={18} /> 0{i + 1}</span>
                  <span className="font-display text-2xl font-semibold">{t as string}</span>
                  <span className="leading-relaxed text-soft">{b as string}</span>
                </li>
              );
            })}
          </ol>
        </section>

        <section id="roi" className="flex scroll-mt-24 flex-col gap-8">
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 className="font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">What could you save?</h2>
            <p className="text-lg text-soft">Put in your own numbers. Everything is calculated in your browser.</p>
          </div>
          <RoiCalculator />
        </section>

        <section id="trust" className="flex scroll-mt-24 flex-col gap-8">
          <h2 className="max-w-3xl font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Autopilot, not autocrat.</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [Lock, "You set the permissions", "Read-only, trim run-times, or full control. Per site, per controller."],
              [Hand, "Manual always wins", "Anything your team changes holds for 24 hours. Autopilot won’t undo it."],
              [ShieldCheck, "Hard limits", "Licence caps and local bans can’t be overridden by Autopilot."],
              [ListChecks, "Every action logged", "Who or what changed what, when and why. Exportable for audits."],
            ].map(([I, t, b]) => {
              const Icon = I as typeof Lock;
              return (
                <div key={t as string} className="card flex flex-col gap-3 p-6">
                  <Icon size={22} className="text-lime" aria-hidden />
                  <h3 className="font-display text-lg font-semibold">{t as string}</h3>
                  <p className="text-sm leading-relaxed text-soft">{b as string}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="contact" className="grid scroll-mt-24 grid-cols-1 gap-10 rounded-[2rem] border border-ink-700 bg-ink-850 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:p-14">
          <div className="flex flex-col gap-5">
            <h2 className="font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">See it on your own site.</h2>
            <p className="text-lg text-soft">Tell us what you water. We’ll show you Brook running on a copy of your layout, with your weather and your tariff.</p>
            <Link href="/app" className="group flex w-fit items-center gap-2 font-semibold text-aqua">
              Or click around the live demo now <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
            </Link>
          </div>
          <ContactForm />
        </section>
      </main>

      <footer className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 border-t border-ink-750 px-5 py-8 text-[13px] text-mute sm:px-8">
        <Logo size={22} />
        <span>© 2026 Brook · Smart irrigation control</span>
      </footer>
    </div>
  );
}

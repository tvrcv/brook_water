"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  CloudRain,
  Command,
  Gauge,
  Home,
  MapPin,
  Pause,
  Play,
  Plug,
  RotateCcw,
  Search,
  Sparkles,
  FileBarChart,
} from "lucide-react";
import { useDemo } from "@/lib/demo/store";
import { ORG } from "@/lib/demo/catalog";
import { FeedIcon, Logo, Pill } from "./ui";

const NAV = [
  { href: "/app", label: "Overview", icon: Home, exact: true },
  { href: "/app/sites", label: "Sites", icon: MapPin },
  { href: "/app/autopilot", label: "Autopilot", icon: Sparkles },
  { href: "/app/reports", label: "Reports", icon: FileBarChart },
  { href: "/app/connect", label: "Integrations", icon: Plug },
];

function useActive() {
  const path = usePathname();
  return (href: string, exact?: boolean) => (exact ? path === href : path === href || path.startsWith(href + "/"));
}

export function AppShell({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-dvh lg:flex">
      <Sidebar onSearch={() => setPaletteOpen(true)} />
      <div className="min-w-0 flex-1">
        <DemoBanner />
        <MobileTop onSearch={() => setPaletteOpen(true)} />
        <main className="mx-auto w-full max-w-[1400px] px-4 pt-5 pb-32 sm:px-6 lg:px-10 lg:pt-8 lg:pb-16">{children}</main>
      </div>
      <MobileTabs />
      <Toaster />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

function Sidebar({ onSearch }: { onSearch: () => void }) {
  const active = useActive();
  const { sites, openAlerts, plans } = useDemo();
  const zones = sites.reduce((a, s) => a + s.zones.length, 0);
  const on = sites.filter((s) => plans[s.id].autopilot && plans[s.id].mode !== "winter").length;
  return (
    <aside className="no-print sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col gap-7 border-r border-ink-750 px-4 py-6 lg:flex">
      <Link href="/" className="px-2" aria-label="Brook home">
        <Logo />
      </Link>
      <button className="flex items-center gap-3 rounded-2xl border border-ink-700 bg-ink-850 px-3 py-2.5 text-left hover:bg-ink-800">
        <span className="flex size-8 items-center justify-center rounded-lg bg-[#1e2a36] text-[13px] font-semibold">{ORG.initials}</span>
        <span className="flex flex-1 flex-col">
          <span className="text-sm font-semibold">{ORG.name}</span>
          <span className="text-xs text-mute">
            {sites.length} sites · {zones} zones
          </span>
        </span>
        <ChevronDown size={16} className="text-mute" />
      </button>
      <button
        onClick={onSearch}
        className="flex h-11 items-center gap-2.5 rounded-xl bg-ink-850 px-3 text-sm text-mute ring-1 ring-ink-700 hover:text-soft"
      >
        <Search size={16} />
        <span className="flex-1 text-left">Search or run…</span>
        <kbd className="flex items-center gap-0.5 rounded-md bg-ink-750 px-1.5 py-0.5 text-[11px] text-soft">
          <Command size={11} />K
        </kbd>
      </button>
      <nav aria-label="Main" className="flex flex-col gap-0.5">
        {NAV.map(({ href, label, icon: I, exact }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors",
              active(href, exact) ? "bg-ink-800 font-semibold text-fg" : "font-medium text-mute hover:bg-ink-850 hover:text-soft",
            )}
          >
            <I size={18} strokeWidth={1.9} />
            <span className="flex-1">{label}</span>
            {href === "/app/autopilot" && openAlerts.length > 0 && (
              <span className="rounded-full bg-coral px-2 py-0.5 text-[11px] font-semibold text-[#1a0a07]">{openAlerts.length}</span>
            )}
          </Link>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-2 rounded-2xl border border-ink-700 bg-ink-850 p-4">
        <span className="flex items-center gap-2 text-xs text-mute">
          <Gauge size={14} /> Autopilot
        </span>
        <span className="font-display text-base font-semibold">
          On at {on} of {sites.length} sites
        </span>
        <span className="text-xs leading-relaxed text-mute">Leak guard and compliance reports included on every plan.</span>
      </div>
    </aside>
  );
}

function DemoBanner() {
  const { actions } = useDemo();
  return (
    <div className="no-print flex items-center justify-center gap-3 border-b border-ink-750 bg-ink-900 px-4 py-2 text-[13px] text-soft">
      <span className="hidden size-1.5 rounded-full bg-amber sm:inline-block" />
      <span className="truncate">
        <span className="font-semibold text-fg">Demo workspace.</span> Data is simulated live for a fictional company.
      </span>
      <button onClick={actions.reset} className="hidden items-center gap-1.5 rounded-lg px-2 py-1 text-mute hover:bg-ink-800 hover:text-fg sm:flex">
        <RotateCcw size={13} /> Reset
      </button>
      <Link href="/#contact" className="shrink-0 font-semibold text-aqua hover:text-[#a8eeff]">
        Book a demo →
      </Link>
    </div>
  );
}

function MobileTop({ onSearch }: { onSearch: () => void }) {
  const { openAlerts } = useDemo();
  return (
    <div className="no-print sticky top-0 z-30 flex items-center gap-3 border-b border-ink-750 bg-ink-950/85 px-4 py-3 backdrop-blur-lg lg:hidden">
      <Link href="/" aria-label="Brook home">
        <Logo size={24} />
      </Link>
      <span className="flex-1" />
      <button onClick={onSearch} aria-label="Search" className="flex size-10 items-center justify-center rounded-full bg-ink-800 text-soft">
        <Search size={18} />
      </button>
      <Link href="/app/autopilot#alerts" aria-label={`Alerts, ${openAlerts.length} open`} className="relative flex size-10 items-center justify-center rounded-full bg-ink-800 text-soft">
        <Bell size={18} />
        {openAlerts.length > 0 && <span className="absolute top-2 right-2.5 size-2 rounded-full bg-coral" />}
      </Link>
    </div>
  );
}

function MobileTabs() {
  const active = useActive();
  return (
    <nav aria-label="App" className="no-print fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-ink-750 bg-ink-900/90 pb-[max(env(safe-area-inset-bottom),8px)] backdrop-blur-xl lg:hidden">
      {NAV.map(({ href, label, icon: I, exact }) => (
        <Link
          key={href}
          href={href}
          className={clsx("flex flex-col items-center gap-1 pt-2.5 pb-1 text-[11px] font-medium", active(href, exact) ? "text-aqua" : "text-mute")}
        >
          <I size={22} strokeWidth={1.8} />
          {label === "Integrations" ? "Connect" : label}
        </Link>
      ))}
    </nav>
  );
}

function Toaster() {
  const { toasts, actions } = useDemo();
  return (
    <div aria-live="polite" className="no-print pointer-events-none fixed inset-x-3 bottom-24 z-50 flex flex-col items-center gap-2 lg:inset-x-auto lg:right-6 lg:bottom-6 lg:items-end">
      {toasts.map((t) => (
        <ToastItem key={t.id} id={t.id} title={t.title} body={t.body} tone={t.tone} onDone={actions.dismissToast} />
      ))}
    </div>
  );
}

function ToastItem({ id, title, body, tone, onDone }: { id: string; title: string; body?: string; tone: "good" | "alert" | "info"; onDone: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDone(id), 4500);
    return () => clearTimeout(t);
  }, [id, onDone]);
  return (
    <div className="pointer-events-auto flex w-full max-w-sm animate-toast items-center gap-3 rounded-2xl border border-ink-600 bg-ink-800/95 p-3 pr-4 shadow-2xl backdrop-blur-xl">
      <FeedIcon icon={tone === "alert" ? "alert" : tone === "good" ? "check" : "sensor"} tone={tone} size={36} />
      <span className="flex min-w-0 flex-col">
        <span className="text-sm font-semibold">{title}</span>
        {body && <span className="text-xs text-soft">{body}</span>}
      </span>
    </div>
  );
}

interface PaletteItem {
  id: string;
  label: string;
  hint: string;
  group: string;
  run: () => void;
  icon: typeof Home;
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { sites, actions, paused } = useDemo();
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const ref = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      setQ("");
      setI(0);
      setTimeout(() => input.current?.focus(), 0);
    }
    if (!open && d.open) d.close();
  }, [open]);

  const items = useMemo<PaletteItem[]>(() => {
    const go = (href: string) => () => router.push(href);
    const list: PaletteItem[] = [
      ...NAV.map((n) => ({ id: n.href, label: n.label, hint: "Go to page", group: "Pages", run: go(n.href), icon: n.icon })),
      ...sites.map((s) => ({ id: s.id, label: s.name, hint: `${s.typeLabel} · ${s.city}`, group: "Sites", run: go(`/app/sites/${s.id}`), icon: MapPin })),
      ...sites.flatMap((s) =>
        s.zones.map((z) => ({
          id: `${s.id}-${z.id}`,
          label: `${z.id} · ${z.kind.label} ${z.n}`,
          hint: s.name,
          group: "Zones",
          run: go(`/app/sites/${s.id}?zone=${z.id}`),
          icon: MapPin,
        })),
      ),
      {
        id: "rain-all",
        label: "Rain delay on all sites",
        hint: "Skip tonight everywhere",
        group: "Actions",
        icon: CloudRain,
        run: () => {
          actions.setRainDelay("all", true);
          actions.toast({ title: "Rain delay on", body: "No site will water tonight", tone: "info" });
        },
      },
      {
        id: "pause",
        label: paused ? "Resume Autopilot" : "Pause all watering",
        hint: paused ? "Plans come back for every site" : "Stops tonight’s plans",
        group: "Actions",
        icon: paused ? Play : Pause,
        run: () => {
          actions.setPaused(!paused);
          actions.toast({ title: paused ? "Autopilot resumed" : "All watering paused", tone: "info" });
        },
      },
      { id: "reset", label: "Reset demo", hint: "Start the walkthrough again", group: "Actions", icon: RotateCcw, run: actions.reset },
    ];
    return list;
  }, [sites, actions, paused, router]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = s ? items.filter((x) => `${x.label} ${x.hint}`.toLowerCase().includes(s)) : items.filter((x) => x.group !== "Zones");
    return base.slice(0, 12);
  }, [q, items]);

  const run = (it: PaletteItem | undefined) => {
    if (!it) return;
    onClose();
    it.run();
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label="Search and commands"
      className="mx-auto mt-[12vh] w-[calc(100%-24px)] max-w-xl rounded-3xl border border-ink-600 bg-ink-850 p-0 text-fg shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm open:animate-pop"
    >
      <label className="flex items-center gap-3 border-b border-ink-750 px-5">
        <Search size={18} className="text-mute" />
        <span className="sr-only">Search sites, zones and actions</span>
        <input
          ref={input}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setI(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setI((x) => Math.min(filtered.length - 1, x + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setI((x) => Math.max(0, x - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              run(filtered[i]);
            }
          }}
          placeholder="Search sites, zones like “G7”, or actions"
          className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-mute"
        />
        <kbd className="rounded-md bg-ink-750 px-1.5 py-0.5 text-[11px] text-mute">Esc</kbd>
      </label>
      <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox" aria-label="Results">
        {filtered.length === 0 && <li className="px-4 py-6 text-center text-sm text-mute">Nothing matches “{q}”.</li>}
        {filtered.map((it, k) => {
          const I = it.icon;
          return (
            <li key={it.id} role="option" aria-selected={k === i}>
              <button
                onMouseEnter={() => setI(k)}
                onClick={() => run(it)}
                className={clsx("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left", k === i ? "bg-ink-750" : "")}
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-ink-800 text-aqua">
                  <I size={16} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold">{it.label}</span>
                  <span className="truncate text-xs text-mute">{it.hint}</span>
                </span>
                <Pill tone="muted">{it.group}</Pill>
              </button>
            </li>
          );
        })}
      </ul>
    </dialog>
  );
}

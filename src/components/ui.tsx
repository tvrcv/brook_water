"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  CloudRain,
  Droplet,
  Radio,
  Snowflake,
  Wind,
  Zap,
  X,
} from "lucide-react";
import type { FeedEvent } from "@/lib/demo/types";

export function Logo({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <span className={clsx("flex items-center gap-2.5", className)}>
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.5c3.6 4.3 6.5 8 6.5 11.5a6.5 6.5 0 0 1-13 0c0-3.5 2.9-7.2 6.5-11.5z" fill="var(--color-aqua)" />
        <path d="M9 14.5a3 3 0 0 0 3 3" stroke="var(--color-aqua-deep)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      </svg>
      <span className="font-display text-2xl font-bold tracking-[-0.04em]">brook</span>
    </span>
  );
}

export function Card({ className, ...p }: ComponentProps<"div">) {
  return <div className={clsx("card", className)} {...p} />;
}

type Variant = "primary" | "secondary" | "ghost" | "danger" | "light";
const variants: Record<Variant, string> = {
  primary: "bg-aqua text-aqua-deep font-semibold hover:brightness-110",
  secondary: "bg-ink-850 border border-ink-700 text-fg hover:bg-ink-800",
  ghost: "text-soft hover:text-fg hover:bg-ink-800",
  danger: "bg-coral text-[#1a0a07] font-semibold hover:brightness-110",
  light: "bg-fg text-ink-950 font-semibold hover:bg-white",
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...p
}: ComponentProps<"button"> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none",
        size === "sm" && "h-9 px-3 text-[13px]",
        size === "md" && "h-11 px-4 text-sm",
        size === "lg" && "h-14 px-6 text-base rounded-2xl",
        variants[variant],
        className,
      )}
      {...p}
    />
  );
}

export function ButtonLink({
  variant = "secondary",
  size = "md",
  className,
  ...p
}: ComponentProps<typeof Link> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  return (
    <Link
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition active:scale-[0.97]",
        size === "sm" && "h-9 px-3 text-[13px]",
        size === "md" && "h-11 px-4 text-sm",
        size === "lg" && "h-14 px-7 text-base rounded-full",
        variants[variant],
        className,
      )}
      {...p}
    />
  );
}

export function Switch({
  on,
  onChange,
  label,
  size = "md",
}: {
  on: boolean;
  onChange: (on: boolean) => void;
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={clsx(
        "relative shrink-0 rounded-full transition-colors duration-200",
        size === "md" ? "h-8 w-14" : "h-7 w-12",
        on ? "bg-aqua" : "bg-ink-500",
      )}
    >
      <span
        className={clsx(
          "absolute top-1 left-1 rounded-full bg-fg shadow transition-transform duration-200",
          size === "md" ? "size-6" : "size-5",
          on && (size === "md" ? "translate-x-6" : "translate-x-5"),
        )}
      />
    </button>
  );
}

type Tone = "aqua" | "lime" | "coral" | "amber" | "muted" | "dark";
const tones: Record<Tone, string> = {
  aqua: "bg-aqua/15 text-aqua",
  lime: "bg-lime/15 text-lime",
  coral: "bg-coral/15 text-coral",
  amber: "bg-amber/15 text-amber",
  muted: "bg-ink-700 text-soft",
  dark: "bg-aqua-deep/15 text-aqua-deep border border-aqua-deep/25",
};

export function Pill({ tone = "muted", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}

export function LiveDot({ className }: { className?: string }) {
  return <span className={clsx("inline-block size-2 rounded-full bg-lime animate-pulse-dot", className)} />;
}

/** Counts towards a new value whenever it changes. */
export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString("en-US"),
  duration = 700,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const e = 1 - Math.pow(1 - k, 3);
      setShown(a + (value - a) * e);
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      from.current = value;
    };
  }, [value, duration]);
  return <span className="tnum">{format(shown)}</span>;
}

const FEED_ICONS = {
  rain: CloudRain,
  alert: AlertTriangle,
  bolt: Zap,
  drop: Droplet,
  calendar: CalendarClock,
  frost: Snowflake,
  wind: Wind,
  check: Check,
  sensor: Radio,
} as const;

export function FeedIcon({ icon, tone, size = 40 }: { icon: FeedEvent["icon"]; tone: FeedEvent["tone"]; size?: number }) {
  const I = FEED_ICONS[icon];
  return (
    <span
      style={{ width: size, height: size }}
      className={clsx(
        "flex shrink-0 items-center justify-center rounded-full",
        tone === "good" && "bg-lime/15 text-lime",
        tone === "alert" && "bg-coral/15 text-coral",
        tone === "info" && "bg-aqua/15 text-aqua",
      )}
    >
      <I size={size * 0.45} strokeWidth={2} aria-hidden />
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={title}
      className={clsx(
        "m-auto w-[calc(100%-24px)] rounded-3xl border border-ink-700 bg-ink-850 p-0 text-fg shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm open:animate-pop max-sm:mb-3",
        wide ? "max-w-2xl" : "max-w-md",
      )}
    >
      <div className="flex items-center justify-between gap-4 border-b border-ink-750 px-6 py-4">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <button onClick={onClose} aria-label="Close" className="flex size-10 items-center justify-center rounded-full text-mute hover:bg-ink-800 hover:text-fg">
          <X size={18} />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  );
}

export function SectionTitle({ children, aside, id }: { children: ReactNode; aside?: ReactNode; id?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 id={id} className="font-display text-xl font-semibold tracking-[-0.01em]">
        {children}
      </h2>
      {aside}
    </div>
  );
}

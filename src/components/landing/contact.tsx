"use client";

import { useState } from "react";
import { SITE } from "@/config/site";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const body = [
          `Name: ${f.get("name")}`,
          `Company: ${f.get("company")}`,
          `Email: ${f.get("email")}`,
          `Sites: ${f.get("sites")}`,
          "",
          String(f.get("message") ?? ""),
        ].join("\n");
        window.location.href = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(`Brook demo request — ${f.get("company")}`)}&body=${encodeURIComponent(body)}`;
        setSent(true);
      }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field name="name" label="Your name" autoComplete="name" required />
        <Field name="company" label="Company" autoComplete="organization" required />
        <Field name="email" label="Work email" type="email" autoComplete="email" required />
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          What do you water?
          <select name="sites" className="h-12 rounded-xl border border-ink-700 bg-ink-900 px-3 font-normal outline-none focus:border-aqua">
            <option>Golf course</option>
            <option>Stadium or sports pitch</option>
            <option>Factory or industrial site</option>
            <option>Station or transit hub</option>
            <option>Campus, park or resort</option>
            <option>Several of these</option>
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Anything we should know?
        <textarea name="message" rows={3} className="rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 font-normal outline-none focus:border-aqua" placeholder="Controller brand, number of sites, water source…" />
      </label>
      <button type="submit" className="mt-1 h-14 rounded-full bg-aqua font-semibold text-aqua-deep transition hover:brightness-110 active:scale-[0.98]">
        Book a 20-minute demo
      </button>
      {sent && <p className="text-center text-sm text-lime">Your email app should open with the request ready to send.</p>}
    </form>
  );
}

function Field({ label, ...p }: { label: string } & React.ComponentProps<"input">) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold">
      {label}
      <input {...p} className="h-12 w-full min-w-0 rounded-xl border border-ink-700 bg-ink-900 px-4 font-normal outline-none focus:border-aqua" />
    </label>
  );
}

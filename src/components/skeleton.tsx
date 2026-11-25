import { Logo } from "./ui";

/** Shown for a moment while the demo world is generated in the browser. */
export function AppSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5" role="status" aria-label="Loading demo">
      <div className="animate-pulse">
        <Logo size={40} />
      </div>
      <span className="text-sm text-mute">Loading live demo…</span>
    </div>
  );
}

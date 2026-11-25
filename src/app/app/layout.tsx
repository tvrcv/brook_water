import { Suspense } from "react";
import type { Metadata } from "next";
import { DemoProvider } from "@/lib/demo/store";
import { AppShell } from "@/components/shell";
import { AppSkeleton } from "@/components/skeleton";

export const metadata: Metadata = {
  title: "Demo dashboard",
  robots: { index: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AppSkeleton />}>
      <DemoProvider>
        <AppShell>{children}</AppShell>
      </DemoProvider>
    </Suspense>
  );
}

import type { Metadata } from "next";
import { SitesView } from "@/views/sites";

export const metadata: Metadata = { title: "Sites" };

export default function Page() {
  return <SitesView />;
}

import type { Metadata } from "next";
import { SITE_SEEDS } from "@/lib/demo/catalog";
import { SiteRoute } from "./site-route";

export const metadata: Metadata = { title: "Site" };

export function generateStaticParams() {
  return SITE_SEEDS.map((s) => ({ id: s.id }));
}

export default function Page({ params }: PageProps<"/app/sites/[id]">) {
  return <SiteRoute params={params} />;
}

"use client";

import { use } from "react";
import { SiteView } from "@/views/site";

export function SiteRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <SiteView id={id} />;
}

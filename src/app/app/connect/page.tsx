import type { Metadata } from "next";
import { ConnectView } from "@/views/connect";

export const metadata: Metadata = { title: "Integrations" };

export default function Page() {
  return <ConnectView />;
}

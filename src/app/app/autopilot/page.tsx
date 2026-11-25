import type { Metadata } from "next";
import { AutopilotView } from "@/views/autopilot";

export const metadata: Metadata = { title: "Autopilot" };

export default function Page() {
  return <AutopilotView />;
}

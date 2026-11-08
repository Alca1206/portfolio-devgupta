import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Playground from "@/components/playground/Playground";

export const metadata: Metadata = {
  title: "Confidence calibration experiment",
  description:
    "An interactive confidence calibration experiment: a real trained model, real held-out predictions, and metrics computed live in your browser.",
  alternates: { canonical: "/playground/calibration" },
};

export default function CalibrationPage() {
  return (
    <>
      <div className="container-page pt-12">
        <Link href="/playground" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={16} aria-hidden="true" />
          All demos
        </Link>
      </div>
      <Playground />
    </>
  );
}

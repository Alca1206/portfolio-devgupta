import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Section from "@/components/ui/Section";
import Card from "@/components/ui/Card";
import { playgroundEntries } from "@/lib/playground";


export const metadata: Metadata = {
  title: "ML Playground",
  description:
    "Interactive demos: a confidence calibration experiment and step-by-step walkthroughs of how my projects work inside.",
  alternates: { canonical: "/playground" },
};

export default function PlaygroundPage() {
  return (
    <Section
      id="playground"
      title="ML Playground"
      description="Things you can click through. Pick a demo to see an experiment run or to follow how one of my projects works inside."
    >
      <ul className="grid gap-6 md:grid-cols-2">
        <li>
          <DemoCard
            href="/playground/calibration"
            tag="Live experiment"
            title="Is the model as sure as it should be?"
            text="A real trained model and real held-out predictions. Metrics are computed live in your browser."
          />
        </li>
        {playgroundEntries().map(({ project, lab, demo }) => (
          <li key={project.slug}>
            <DemoCard
              href={`/playground/${project.slug}`}
              tag={[lab && "Live lab", demo && "Walkthrough"].filter(Boolean).join(" · ")}
              title={project.title}
              text={[lab && "Try it live in your browser", demo && "see how it works step by step, with the real code"].filter(Boolean).join(", and ") + "."}
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}

function DemoCard({
  href,
  tag,
  title,
  text,
}: {
  href: string;
  tag: string;
  title: string;
  text: string;
}) {
  return (
    <Card className="relative h-full transition-colors hover:border-violet">
      <p className="text-xs uppercase tracking-wide text-violet">{tag}</p>
      <h2 className="mt-2 font-display text-xl font-semibold">
        <Link href={href} className="after:absolute after:inset-0">
          {title}
        </Link>
      </h2>
      <p className="mt-3 text-ink-muted">{text}</p>
      <p className="mt-4 inline-flex items-center gap-1 text-sm text-violet">
        Open <ArrowUpRight size={16} aria-hidden="true" />
      </p>
    </Card>
  );
}

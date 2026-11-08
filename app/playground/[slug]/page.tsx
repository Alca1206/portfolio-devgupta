import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import DemoPlayer from "@/components/playground/DemoPlayer";
import HouseLab from "@/components/playground/HouseLab";
import PaperPilotLab from "@/components/playground/PaperPilotLab";
import PlaygroundTabs from "@/components/playground/PlaygroundTabs";
import Button from "@/components/ui/Button";
import { projectPath } from "@/data/projects";
import { playgroundEntries, playgroundEntry } from "@/lib/playground";

// Which component runs each live lab (the lab's slug in data/labs.ts).
const labViews: Record<string, ReactNode> = {
  "house-price-model": <HouseLab />,
  "paperpilot-lab": <PaperPilotLab />,
};

export function generateStaticParams() {
  return playgroundEntries().map((e) => ({ slug: e.project.slug }));
}

export async function generateMetadata({ params }: PageProps<"/playground/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const entry = playgroundEntry(slug);
  if (!entry) return {};
  return {
    title: `${entry.project.title}: Playground`,
    description: entry.lab?.summary ?? entry.demo?.summary,
    alternates: { canonical: `/playground/${slug}` },
  };
}

export default async function ProjectPlaygroundPage({ params }: PageProps<"/playground/[slug]">) {
  const { slug } = await params;
  const entry = playgroundEntry(slug);
  if (!entry) notFound();
  const { project, lab, demo } = entry;
  const projectHref = projectPath(project);

  const tabs = [
    lab && labViews[lab.slug]
      ? {
          id: "try" as const,
          label: "Try it",
          content: (
            <>
              <p className="max-w-2xl text-lead text-ink-muted">{lab.summary}</p>
              <div className="mt-10">{labViews[lab.slug]}</div>
            </>
          ),
        }
      : null,
    demo
      ? {
          id: "how" as const,
          label: "How it works",
          content: (
            <>
              <h2 className="max-w-3xl font-display text-2xl font-semibold">{demo.title}</h2>
              <p className="mt-3 max-w-2xl text-lead text-ink-muted">{demo.summary}</p>
              <div className="mt-10">
                <DemoPlayer demo={demo} />
              </div>
            </>
          ),
        }
      : null,
  ]
    .filter((t) => t !== null)
    // "How it works" comes first, "Try it" second (the first tab is also the default one).
    .sort((a, b) => Number(b.id === "how") - Number(a.id === "how"));
  if (tabs.length === 0) notFound();

  return (
    <article className="container-page py-16 md:py-24">
      <Link href="/playground" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} aria-hidden="true" />
        All demos
      </Link>
      <h1 className="mt-8 max-w-3xl text-h2 font-semibold">{project.title}</h1>
      <div className="mt-6 flex flex-wrap gap-3">
        {projectHref && (
          <Link
            href={projectHref}
            className="inline-flex items-center justify-center rounded-md bg-violet px-6 py-3 font-medium text-space transition-colors hover:bg-cyan"
          >
            About the project
          </Link>
        )}
        <Button href={project.repoUrl} variant="secondary">
          View source on GitHub
        </Button>
      </div>
      <div className="mt-12">
        <PlaygroundTabs tabs={tabs} />
      </div>
    </article>
  );
}

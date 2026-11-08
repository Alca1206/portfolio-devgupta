import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import { projects } from "@/data/projects";
import { playgroundEntry } from "@/lib/playground";

const statusLabel = {
  placeholder: "Placeholder",
  "in-progress": "In progress",
  complete: "Complete",
} as const;

// Build one page per project that has a `detail` in data/projects.ts.
export function generateStaticParams() {
  return projects.filter((p) => p.detail).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  const detail = project?.detail;
  if (!project || !detail) return {};
  return {
    title: project.title,
    description: detail.overview,
  };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  const detail = project?.detail;
  if (!project || !detail) notFound();
  const playground = playgroundEntry(project.slug);

  return (
    <article className="container-page py-16 md:py-24">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        All projects
      </Link>

      <p className="mt-8 w-fit rounded border border-line px-2 py-0.5 text-xs text-ink-muted">
        {statusLabel[project.status]}
      </p>
      <h1 className="mt-4 max-w-3xl text-h2 font-semibold">{project.title}</h1>
      <p className="mt-4 max-w-2xl text-lead text-ink-muted">{detail.overview}</p>

      <ul aria-label="Technologies" className="mt-6 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <li key={tag}>
            <Tag>{tag}</Tag>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button href={project.repoUrl}>View source on GitHub</Button>
        {playground && (
          <Link
            href={`/playground/${project.slug}`}
            className="inline-flex items-center justify-center rounded-md border border-line px-6 py-3 font-medium text-ink transition-colors hover:border-cyan hover:text-cyan"
          >
            Try it in the Playground
          </Link>
        )}
      </div>

      <section className="mt-14" aria-labelledby="highlights-title">
        <h2 id="highlights-title" className="font-display text-xl font-semibold">
          What it does
        </h2>
        <ul className="mt-4 max-w-2xl list-disc space-y-3 pl-5 text-ink-muted">
          {detail.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      {detail.notes.length > 0 && (
        <Card className="mt-10 max-w-2xl">
          <h2 className="font-display text-lg font-semibold">Notes</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-muted">
            {detail.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </Card>
      )}
    </article>
  );
}
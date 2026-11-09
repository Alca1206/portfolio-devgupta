import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import Card from "./Card";
import Tag from "./Tag";
import type { Project } from "@/data/types";
import { projectPath } from "@/data/projects";

// Words, not just colors, say where a project stands.
const statusLabel: Record<Project["status"], string> = {
  placeholder: "Placeholder",
  "in-progress": "In progress",
  complete: "Complete",
};

export default function ProjectCard({ project }: { project: Project }) {
  const { title, summary, tags, repoUrl, status } = project;
  const detailHref = projectPath(project);

  return (
    <Card
      className={`relative flex h-full flex-col transition-colors hover:border-violet/50 ${
        detailHref ? "cursor-pointer focus-within:border-violet/50" : ""
      }`}
    >
      <p
        className={`w-fit rounded border px-2 py-0.5 text-xs text-ink-muted ${
          status === "placeholder" ? "border-dashed" : "border-solid"
        } border-line`}
      >
        {statusLabel[status]}
      </p>

      <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-ink-muted">{summary}</p>

      <ul aria-label={`Technologies for ${title}`} className="mt-5 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <li key={tag}>
            <Tag>{tag}</Tag>
          </li>
        ))}
      </ul>

      {/* mt-auto pushes the links to the bottom so cards line up in a row */}
      <div className="mt-auto pt-6">
        <div className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
          {repoUrl ? (
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 inline-flex w-fit items-center gap-1.5 text-ink hover:text-cyan"
            >
              Source code on GitHub
              <ArrowUpRight size={16} aria-hidden="true" />
              <span className="sr-only"> for {title} (opens in a new tab)</span>
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-ink-muted">
              <Clock size={16} aria-hidden="true" />
              GitHub repository: coming soon
            </span>
          )}

          {detailHref ? (
            <Link
              href={detailHref}
              className="inline-flex items-center gap-1.5 text-ink hover:text-cyan after:absolute after:inset-0 after:content-['']"
            >
              Read project details
              <ArrowUpRight size={16} aria-hidden="true" />
              <span className="sr-only"> for {title}</span>
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-ink-muted">
              <Clock size={16} aria-hidden="true" />
              Project details: coming soon
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
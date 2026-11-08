import { projects } from "../data/projects.ts";
import { demos } from "../data/demos.ts";
import { labs } from "../data/labs.ts";
import type { Project } from "../data/types.ts";
import type { Demo } from "../data/demos.ts";
import type { Lab } from "../data/labs.ts";

// One Playground page per project. A project appears there when it has a live lab
// ("Try it"), a how-it-works walkthrough, or both. The page URL is /playground/<project slug>.
export type PlaygroundEntry = { project: Project; lab?: Lab; demo?: Demo };

export function playgroundEntries(): PlaygroundEntry[] {
  return projects
    .map((project) => ({
      project,
      lab: labs.find((l) => l.projectSlug === project.slug),
      demo: demos.find((d) => d.projectSlug === project.slug),
    }))
    .filter((e) => e.lab || e.demo);
}

export function playgroundEntry(slug: string): PlaygroundEntry | undefined {
  return playgroundEntries().find((e) => e.project.slug === slug);
}

import { palette, paletteNames } from "../data/palette.ts";
import type { PaletteName } from "../data/palette.ts";
import { seededRandom } from "./sky.ts";

// Every project gets its own accent colour from the palette. The assignment looks random but
// is fixed: the palette is shuffled once with a seed, then handed out in the order of the
// projects list. So a project keeps its colour, adding a project at the end never changes the
// others, and the first six projects all get different colours.
//
// To re-roll everything, change ACCENT_SEED. To pin one project, set `accent` on it in
// data/projects.ts (for example accent: "amber").
export const ACCENT_SEED = 7;

function shuffled(): PaletteName[] {
  const names = [...paletteNames];
  const rand = seededRandom(ACCENT_SEED);
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [names[i], names[j]] = [names[j], names[i]];
  }
  return names;
}

const order = shuffled();

type HasAccent = { slug: string; accent?: PaletteName };

export function accentName(project: HasAccent, all: HasAccent[]): PaletteName {
  if (project.accent) return project.accent;
  const index = all.findIndex((p) => p.slug === project.slug);
  return order[Math.max(0, index) % order.length];
}

export function accentColors(project: HasAccent, all: HasAccent[]) {
  return palette[accentName(project, all)];
}

/** CSS variables that recolour everything inside an element (see globals.css). */
export function accentStyle(project: HasAccent, all: HasAccent[]): Record<string, string> {
  const c = accentColors(project, all);
  return {
    "--color-violet": c.main,
    "--color-cyan": c.second,
    "--color-accent2": c.second,
  };
}

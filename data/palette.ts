// The colour palette for projects. Each project gets one accent, which colours its star on
// the map, its card, its page, and its Playground page (comet, bars, charts, buttons).
//
//   main   the accent colour
//   second the partner colour: the comet's tail end and hover highlights
//
// The base (night blue, text, borders) is the same for everyone. To add a colour, add a line
// here; to change who gets what, see lib/accents.ts.

export const palette = {
  violet: { main: "#9b8cff", second: "#ff9ecb" },
  sage: { main: "#7fc4b4", second: "#d9c78a" },
  amber: { main: "#e2b765", second: "#e58a6a" },
  rose: { main: "#ee9bb8", second: "#b79bf0" },
  ice: { main: "#8db4ea", second: "#c9d8f5" },
  silver: { main: "#d8dbe6", second: "#8a8fa3" },
} as const;

export type PaletteName = keyof typeof palette;
export const paletteNames = Object.keys(palette) as PaletteName[];

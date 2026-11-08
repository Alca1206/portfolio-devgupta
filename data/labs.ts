// Interactive labs in the ML Playground: things a visitor can change and watch.
// (The how-it-works walkthroughs are in data/demos.ts.) To add a lab, add an entry here
// and show it in app/playground/[slug]/page.tsx (the `labViews` list). It appears as the
// "Try it" tab on its project's Playground page.

export type Lab = {
  slug: string;
  title: string;
  /** The project this lab belongs to (data/projects.ts). */
  projectSlug: string;
  summary: string;
};

export const labs: Lab[] = [
  {
    slug: "house-price-model",
    title: "Try the house-price model",
    projectSlug: "king-county-house-prices",
    summary:
      "The real trained network runs in your browser. Change a house's details and watch the price and the firing neurons update live.",
  },
  {
    slug: "paperpilot-lab",
    title: "Try PaperPilot's chunking and refusal check",
    projectSlug: "paperpilot",
    summary:
      "Cut a text into chunks with PaperPilot's real algorithm, then see when it answers and when it refuses a question.",
  },
];

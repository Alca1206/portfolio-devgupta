import { profile } from "@/data/profile";

// The public address of the site, used for link previews, the sitemap, and robots.txt.
// Order: your own setting, then Vercel's production address (set automatically
// when deployed there), then the local dev address.
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const rawUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (vercelHost ? `https://${vercelHost}` : "http://localhost:3000");

export const siteConfig = {
  url: rawUrl.replace(/\/$/, ""), // no trailing slash
  title: `${profile.name} | ${profile.role}`,
  description: `Portfolio of ${profile.name}, a ${profile.role} working on machine learning, deep learning, and applied AI.`,
};

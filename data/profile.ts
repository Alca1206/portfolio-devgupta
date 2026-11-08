import type { Profile } from "./types";

// EDIT ME: values in [square brackets] are placeholders.
// A value of null means "not available yet" and the site shows "Coming soon".
export const profile: Profile = {
  name: "Dev Gupta",
  brand: "Dev Gupta",
  role: "Data Science master's student",
  focusAreas: ["Machine Learning", "Deep Learning", "Applied AI"],
  heroHeadline: {
    first: "Building intelligent systems.",
    second: "Exploring how they learn.",
  },
  heroText:
    "I'm a Data Science master's student focused on machine learning, deep learning, and applied AI. I enjoy turning technical ideas into working systems and investigating how models behave.",
  about: {
    paragraphs: [
      "I'm a Data Science master's student specializing in machine learning and deep learning, with an engineering background and professional software development experience.",
      "I'm looking for ML Engineer, AI Engineer, and related technical roles, where I can turn ideas into working systems and investigate how models behave.",
      "Before my master's I spent nearly three years at NTT DATA building secure enterprise APIs. Now I bring those habits — testing, CI/CD and careful engineering — to applied ML and LLM systems such as local RAG applications and PyTorch models. I'm available full-time from March 2027.",
    ],
    facts: [
      { label: "University", value: "University of Europe for Applied Sciences, Berlin" },
      { label: "Degree", value: "M.Sc. Data Science, expected February 2027" },
      { label: "Previous experience", value: "Software Engineer, NTT DATA (10/2021 – 07/2024)" },
      { label: "Education", value: "B.E. Computer Science and Engineering, Cambridge Institute of Technology (VTU)" },
    ],
  },
  contact: {
    email: "guptadev.12034@gmail.com",
    github: "https://github.com/Alca1206",
    linkedin: "https://www.linkedin.com/in/devgupta1206/",
    // PDF lives in /public; the prefix keeps the link working on a GitHub Pages subfolder.
    resume: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/Dev_Gupta_Resume.pdf`,
  },
};
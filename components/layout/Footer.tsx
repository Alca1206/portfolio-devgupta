import { profile } from "@/data/profile";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-line">
      <div className="container-page flex flex-col gap-2 py-8 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{profile.brand}</p>
        <p>Built with Next.js, React, and Tailwind CSS.</p>
      </div>
    </footer>
  );
}
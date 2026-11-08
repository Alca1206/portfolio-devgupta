import Link from "next/link";
import type { ReactNode } from "react";

type ButtonProps = {
  /** null = the destination doesn't exist yet, so we render a disabled button. */
  href: string | null;
  /** A page on this site. Uses Next's Link so the GitHub Pages sub-folder prefix is added. */
  internal?: boolean;
  variant?: "primary" | "secondary";
  size?: "sm" | "md";
  children: ReactNode;
  className?: string;
};

const base =
  "inline-flex items-center justify-center rounded-md font-medium transition-colors";

const variants = {
  primary: "bg-violet text-space hover:bg-cyan",
  secondary: "border border-line text-ink hover:border-cyan hover:text-cyan",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
};

export default function Button({
  href,
  internal = false,
  variant = "primary",
  size = "md",
  children,
  className = "",
}: ButtonProps) {
  const styles = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  // No destination yet: show a clearly disabled button instead of a fake link.
  // Dashed border + tooltip + screen-reader text, so it isn't just "greyed out".
  if (href === null) {
    return (
      <button
        type="button"
        disabled
        title="Coming soon"
        className={`${base} ${sizes[size]} ${className} cursor-not-allowed border border-dashed border-line text-ink-muted`}
      >
        {children}
        <span className="sr-only"> (coming soon)</span>
      </button>
    );
  }

  if (internal) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }

  const isExternal = href.startsWith("http");
  return (
    <a
      href={href}
      className={styles}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
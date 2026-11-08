"use client";

import { useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";

type Tab = { id: "try" | "how"; label: string; content: ReactNode };

const HASHES = { try: "#try", how: "#how-it-works" } as const;

function subscribe(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}

// Tabs for one project's Playground page. The chosen tab lives in the address (#try or
// #how-it-works), so it can be linked to. Both panels stay mounted, so switching tabs
// keeps your sliders and your place in the walkthrough.
export default function PlaygroundTabs({ tabs }: { tabs: Tab[] }) {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => "");
  const active = tabs.find((t) => HASHES[t.id] === hash)?.id ?? tabs[0].id;

  const select = (id: Tab["id"]) => {
    window.history.replaceState(null, "", HASHES[id]);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };

  const onKey = (e: KeyboardEvent, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = tabs[(index + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    select(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };

  return (
    <div>
      {tabs.length > 1 && (
        <div role="tablist" aria-label="Views" className="flex flex-wrap gap-2 border-b border-line">
          {tabs.map((t, i) => {
            const on = t.id === active;
            return (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls={`panel-${t.id}`}
                tabIndex={on ? 0 : -1}
                onClick={() => select(t.id)}
                onKeyDown={(e) => onKey(e, i)}
                className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  on ? "border-violet text-ink" : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}
      {tabs.map((t) => (
        <div
          key={t.id}
          id={`panel-${t.id}`}
          role={tabs.length > 1 ? "tabpanel" : undefined}
          aria-labelledby={tabs.length > 1 ? `tab-${t.id}` : undefined}
          hidden={t.id !== active}
          className="pt-10"
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}

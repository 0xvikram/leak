"use client";

import { useState } from "react";

/** The statement as it left the server: every identifier the app removed is stamped where it stood. */
export function AiSaw({
  raw,
  redacted,
  removed,
  skipped,
}: {
  raw: string;
  redacted: string;
  removed: Record<string, number>;
  skipped: boolean;
}) {
  const [view, setView] = useState<"ai" | "raw">("ai");
  const total = Object.values(removed).reduce((a, b) => a + b, 0);
  const text = view === "ai" ? redacted : raw;
  const lines = text.split("\n").slice(0, 14);

  return (
    <section className="fade-up rounded-2xl border border-line bg-surface/80 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-muted">What the AI saw</h2>
          <p className="mt-1 text-sm">
            {skipped ? (
              <span className="text-danger">Stripping was skipped: the raw statement went to Otari.</span>
            ) : (
              <>
                <span className="num text-accent">{total}</span> identifiers removed before any model saw the statement
                {total > 0 && (
                  <span className="text-muted">
                    {" "}
                    ({Object.entries(removed)
                      .map(([k, v]) => `${v} ${k.toLowerCase()}`)
                      .join(", ")})
                  </span>
                )}
              </>
            )}
          </p>
        </div>
        <div className="flex rounded-lg border border-line p-0.5 text-xs" role="tablist">
          {(["ai", "raw"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1 ${view === v ? "bg-raised text-foreground" : "text-muted"}`}
            >
              {v === "ai" ? "Sent to the model" : "Your file"}
            </button>
          ))}
        </div>
      </div>
      <pre className="num mt-4 max-h-64 overflow-auto rounded-xl bg-background/70 p-3 text-[11px] leading-6">
        {lines.map((line, i) => (
          <div key={`${view}-${i}`}>{view === "ai" ? stamp(line) : line}</div>
        ))}
        {text.split("\n").length > lines.length && <div className="text-muted">…</div>}
      </pre>
    </section>
  );
}

function stamp(line: string) {
  const parts = line.split(/(\[(?:IBAN|CARD|ACCOUNT|ROUTING|EMAIL|PHONE)\])/g);
  return parts.map((p, i) =>
    /^\[[A-Z]+\]$/.test(p) ? (
      <span key={i} className="redacted" style={{ animationDelay: `${i * 60}ms` }}>
        {p.slice(1, -1).toLowerCase()}
      </span>
    ) : (
      p
    ),
  );
}

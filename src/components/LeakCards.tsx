"use client";

import { useState } from "react";
import type { OtariTrace } from "@/lib/otari";
import type { Charge, Research } from "@/lib/pipeline";

export const monthlyCost = (c: Charge) =>
  c.cadence === "yearly" ? c.lastAmount / 12 : c.cadence === "weekly" ? (c.lastAmount * 52) / 12 : c.lastAmount;

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

type Draft = { status: "loading" | "done" | "error"; text?: string };

/** One card per charge: keep or plug it, and have the third model write the message that plugs it. */
export function LeakCards({
  charges,
  research,
  plugged,
  onToggle,
  member,
  onTrace,
}: {
  charges: Charge[];
  research: Research[];
  plugged: Set<string>;
  onToggle: (service: string) => void;
  member: string;
  onTrace: (t: OtariTrace) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const find = (service: string) => research.find((r) => r.service.toLowerCase() === service.toLowerCase());

  async function draft(c: Charge) {
    const r = find(c.service);
    setDrafts((d) => ({ ...d, [c.service]: { status: "loading" } }));
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: c.service,
          amount: c.lastAmount,
          kind: c.isFee ? "fee" : "cancel",
          cancelUrl: r?.cancelUrl ?? null,
          member,
        }),
      });
      const body = (await res.json()) as { text?: string; error?: string; trace?: OtariTrace };
      if (body.trace) onTrace(body.trace);
      setDrafts((d) => ({
        ...d,
        [c.service]: res.ok ? { status: "done", text: body.text } : { status: "error", text: body.error },
      }));
    } catch {
      setDrafts((d) => ({ ...d, [c.service]: { status: "error", text: "Could not reach the server" } }));
    }
  }

  const subs = charges.filter((c) => !c.isFee);
  const fees = charges.filter((c) => c.isFee);

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {subs.map((c, i) => {
          const r = find(c.service);
          const off = plugged.has(c.service);
          const d = drafts[c.service];
          return (
            <article
              key={c.service}
              className={`fade-up rounded-2xl border p-4 transition-colors ${
                off ? "border-accent/60 bg-accent-soft" : "border-line bg-surface/80"
              }`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className={`truncate font-medium ${off ? "text-muted line-through" : ""}`}>{c.service}</h3>
                  <p className="text-xs text-muted">{c.category}</p>
                </div>
                <Switch on={!off} label={off ? "Plug" : "Keep"} onChange={() => onToggle(c.service)} />
              </div>
              <div className="num mt-3 flex items-baseline justify-between">
                <span className="text-xl">{money(c.lastAmount)}</span>
                <span className="text-xs text-muted">{money(monthlyCost(c) * 12)}/yr</span>
              </div>
              <div className="mt-2 min-h-8 text-xs text-muted">
                {r?.currentPrice ? <>Today: {r.currentPrice}</> : "Today's price not checked"}
                {r?.note && <div className="mt-0.5">{r.note}</div>}
              </div>
              {off && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  {r?.cancelUrl && (
                    <a href={r.cancelUrl} target="_blank" rel="noreferrer" className="rounded-md border border-line px-2 py-1 hover:border-accent">
                      Cancel page ↗
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => draft(c)}
                    disabled={d?.status === "loading"}
                    className="pill-white px-2 py-1 font-medium disabled:opacity-50"
                  >
                    {d?.status === "loading" ? "Writing…" : d?.status === "done" ? "Rewrite" : "Write the cancellation"}
                  </button>
                </div>
              )}
              {d?.text && <DraftBox text={d.text} error={d.status === "error"} />}
            </article>
          );
        })}
      </div>

      {fees.length > 0 && (
        <div className="rounded-2xl border border-line bg-surface/80 p-4">
          <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-muted">Bank fees</h3>
          <ul className="mt-3 divide-y divide-line">
            {fees.map((c) => {
              const d = drafts[c.service];
              const total = c.amounts.reduce((a, b) => a + b, 0);
              return (
                <li key={c.service} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span>{c.service}</span>
                    <span className="num text-sm">
                      {money(total)} <span className="text-muted">in this statement</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => draft(c)}
                      disabled={d?.status === "loading"}
                      className="rounded-md border border-line px-2 py-1 text-xs hover:border-accent disabled:opacity-50"
                    >
                      {d?.status === "loading" ? "Writing…" : "Ask for a refund"}
                    </button>
                  </div>
                  {d?.text && <DraftBox text={d.text} error={d.status === "error"} />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

function Switch({ on, label, onChange }: { on: boolean; label: string; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className="flex shrink-0 items-center gap-2 text-[11px] uppercase tracking-wider text-muted"
    >
      {on ? "keep" : "plug"}
      <span className={`relative h-5 w-9 rounded-full transition-colors ${on ? "bg-ok/70" : "bg-accent"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

function DraftBox({ text, error }: { text: string; error: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="fade-up mt-3 rounded-lg border border-line bg-background/70 p-3">
      <pre className={`whitespace-pre-wrap text-xs leading-relaxed ${error ? "text-danger" : ""}`}>{text}</pre>
      {!error && (
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(text).then(() => setCopied(true));
          }}
          className="mt-2 text-[11px] text-accent"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      )}
    </div>
  );
}

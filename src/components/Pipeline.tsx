"use client";

import { useState } from "react";
import type { OtariTrace } from "@/lib/otari";

export type NodeState = "idle" | "running" | "done" | "failed" | "blocked" | "off";

export type PipelineNode = {
  id: string;
  title: string;
  feature: string;
  model?: string;
  state: NodeState;
  note?: string;
  traces: OtariTrace[];
};

/** The run as a live map: each Otari feature is a node that lights up as the gateway does its part. */
export function Pipeline({ nodes }: { nodes: PipelineNode[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const selected = nodes.find((n) => n.id === open);

  return (
    <section className="rounded-2xl border border-line bg-surface/80 p-4 sm:p-5">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-muted">Glass box · every request through Otari</h2>
        <span className="num text-xs text-muted">
          ${nodes.flatMap((n) => n.traces).reduce((a, t) => a + t.costUsd, 0).toFixed(4)} total
        </span>
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
        {nodes.map((n, i) => {
          const cost = n.traces.reduce((a, t) => a + t.costUsd, 0);
          const ms = n.traces.reduce((a, t) => Math.max(a, t.ms), 0);
          const fellBack = n.traces.some((t) => t.fallback);
          const prev = nodes[i - 1];
          return (
            <div key={n.id} className="flex flex-col items-stretch gap-2 lg:flex-1 lg:flex-row lg:items-center">
              {i > 0 && (
                <div
                  className="wire mx-auto h-4 w-0.5 lg:h-0.5 lg:w-6 lg:shrink-0"
                  data-live={n.state === "running" || undefined}
                  data-done={prev?.state === "done" && n.state === "done" ? "true" : undefined}
                />
              )}
              <button
                type="button"
                onClick={() => setOpen(open === n.id ? null : n.id)}
                aria-expanded={open === n.id}
                data-state={n.state}
                className="node w-full flex-1 rounded-xl border border-line bg-raised px-3 py-3 text-left hover:border-muted"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-muted">{n.feature}</span>
                  <StateDot state={n.state} />
                </div>
                <div className="mt-1 font-medium">{n.title}</div>
                <div className="mt-0.5 truncate text-xs text-muted">{n.model ?? " "}</div>
                <div className="num mt-2 flex gap-3 text-[11px] text-muted">
                  {n.traces.length > 0 ? (
                    <>
                      <span>${cost.toFixed(4)}</span>
                      <span>{(ms / 1000).toFixed(1)}s</span>
                    </>
                  ) : (
                    <span>{n.note ?? (n.state === "idle" ? "waiting" : " ")}</span>
                  )}
                </div>
                {fellBack && (
                  <div className="mt-2 rounded-md bg-accent-soft px-2 py-0.5 text-[11px] text-accent">rerouted by fallback</div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {selected && <NodeDetail node={selected} />}
    </section>
  );
}

function StateDot({ state }: { state: NodeState }) {
  const label = { idle: "", running: "running", done: "done", failed: "failed", blocked: "blocked", off: "not set up" }[state];
  const color =
    state === "done" ? "bg-ok" : state === "running" ? "bg-accent animate-pulse" : state === "idle" || state === "off" ? "bg-line" : "bg-danger";
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-muted">
      {label}
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
    </span>
  );
}

function NodeDetail({ node }: { node: PipelineNode }) {
  return (
    <div className="fade-up mt-4 rounded-xl border border-line bg-background/60 p-4 text-sm">
      <div className="font-medium">{node.title}</div>
      {node.note && <p className="mt-1 text-muted">{node.note}</p>}
      {node.traces.length === 0 && <p className="mt-1 text-muted">No requests yet.</p>}
      <ul className="mt-3 space-y-3">
        {node.traces.map((t, i) => (
          <li key={`${t.requestId}-${i}`} className="rounded-lg border border-line p-3">
            <div className="num flex flex-wrap justify-between gap-2 text-xs text-muted">
              <span className="text-foreground">{t.step}</span>
              <span>
                {(t.ms / 1000).toFixed(1)}s · ${t.costUsd.toFixed(5)} · {t.promptTokens + t.completionTokens} tokens
              </span>
            </div>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
              <dt className="text-muted">asked for</dt>
              <dd className="num truncate">{t.model}</dd>
              <dt className="text-muted">served by</dt>
              <dd className="num truncate">
                {t.servedBy}
                {t.provider ? ` on ${t.provider}` : ""}
                {t.fallback ? " (fallback)" : ""}
              </dd>
              {t.guardrails && (
                <>
                  <dt className="text-muted">guardrail</dt>
                  <dd className="num truncate">{t.guardrails}</dd>
                </>
              )}
              {t.endUserBudget && (
                <>
                  <dt className="text-muted">member budget</dt>
                  <dd className="num truncate">{t.endUserBudget}</dd>
                </>
              )}
              {t.requestId && (
                <>
                  <dt className="text-muted">request id</dt>
                  <dd className="num truncate">{t.requestId}</dd>
                </>
              )}
            </dl>
            {t.toolCalls.map((c, j) => (
              <div key={j} className="mt-2 text-xs">
                <span className="text-accent">{c.type.replace(/_/g, " ")}</span>{" "}
                <span className="text-muted">{c.query ?? c.url ?? c.status}</span>
                {c.code && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-muted">Python it ran</summary>
                    <pre className="num mt-1 max-h-56 overflow-auto rounded bg-background p-2 text-[10px] leading-relaxed">{c.code}</pre>
                    {c.stdout && (
                      <pre className="num mt-1 max-h-24 overflow-auto rounded bg-background p-2 text-[10px] text-ok">{c.stdout}</pre>
                    )}
                  </details>
                )}
              </div>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}

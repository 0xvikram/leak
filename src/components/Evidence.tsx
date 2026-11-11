"use client";

import { useState } from "react";
import type { OtariTrace } from "@/lib/otari";

type Row = { item: string; status: "proven" | "not this run"; proof: string; ids: string[] };

/**
 * Each Otari feature on the judging rubric, with the request that proves it on this run.
 * A feature only counts here when Otari's own response shows it happened.
 */
export function Evidence({
  traces,
  blocked,
  budgetRefused,
  member,
}: {
  traces: OtariTrace[];
  blocked: boolean;
  budgetRefused: boolean;
  member: string;
}) {
  const [copied, setCopied] = useState(false);
  const ids = (ts: OtariTrace[]) => ts.map((t) => t.requestId).filter((x): x is string => Boolean(x));
  const by = (prefix: string) => traces.filter((t) => t.step.startsWith(prefix));
  const models = new Set(traces.filter((t) => t.model !== "sandbox").map((t) => t.servedBy));
  const web = traces.filter((t) => t.toolCalls.some((c) => c.type.startsWith("web_")));
  const searches = web.flatMap((t) => t.toolCalls.filter((c) => c.type.startsWith("web_")));
  const sandbox = traces.filter((t) => t.toolCalls.some((c) => c.type === "code_execution"));
  const guarded = traces.filter((t) => t.guardrails);
  const budgeted = traces.filter((t) => t.endUserBudget);
  const routed = traces.filter((t) => !t.model.includes("/") && t.model !== "sandbox");
  const fellBack = traces.filter((t) => t.fallback);

  const row = (item: string, ok: boolean, proof: string, list: OtariTrace[]): Row => ({
    item,
    status: ok ? "proven" : "not this run",
    proof,
    ids: ids(list).slice(0, 3),
  });

  const rows: Row[] = [
    row("Open-weight models", models.size > 0, [...models].filter(Boolean).join(", "), traces.filter((t) => t.model !== "sandbox")),
    row(
      "Models in distinct roles",
      models.size >= 2,
      `extract: ${by("extract")[0]?.servedBy ?? "-"} · research: ${by("research")[0]?.servedBy ?? "-"} · draft: ${by("draft")[0]?.servedBy ?? "plug a leak to run"}`,
      [...by("extract").slice(0, 1), ...by("research").slice(0, 1), ...by("draft").slice(0, 1)],
    ),
    row("Web search and fetch", searches.length > 0, `${searches.length} web calls run by Otari`, web),
    row("Code execution", sandbox.length > 0, "totals computed in Otari's sandbox", sandbox),
    row(
      "Guardrails",
      guarded.length > 0 || blocked,
      blocked ? "guardrail_violation: unstripped statement refused" : guarded.length ? `verdict on ${guarded.length} requests` : "no verdict header: mandate a guardrail",
      guarded,
    ),
    row(
      "Per-user budgets",
      budgeted.length > 0 || budgetRefused,
      budgetRefused ? `${member}'s budget refused the request` : budgeted.length ? `billed to household:${member}` : "needs the service key's end-user budget",
      budgeted,
    ),
    row(
      "Routing and fallback",
      routed.length > 0,
      routed.length ? `policy ${routed[0].model}${fellBack.length ? ", backup served it" : ""}` : "no routing policy on this run",
      routed,
    ),
  ];
  const proven = rows.filter((r) => r.status === "proven").length;

  function markdown() {
    const lines = [
      `Leak run evidence (${new Date().toISOString()})`,
      "",
      "| Rubric item | Status | What Otari reported | Otari request IDs |",
      "| --- | --- | --- | --- |",
      ...rows.map((r) => `| ${r.item} | ${r.status} | ${r.proof} | ${r.ids.join(", ") || "-"} |`),
    ];
    return lines.join("\n");
  }

  return (
    <section className="fade-up rounded-2xl border border-line bg-surface/80 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-muted">Proof, from Otari&apos;s own responses</h2>
          <p className="mt-1 text-sm">
            <span className="grad-text num font-medium">
              {proven} of {rows.length}
            </span>{" "}
            Otari features shown on this run
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(markdown()).then(() => setCopied(true))}
          className="rounded-full border border-line px-3 py-1.5 text-xs hover:border-muted"
        >
          {copied ? "Copied" : "Copy as Markdown"}
        </button>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-muted">
            <tr className="border-b border-line">
              <th className="py-2 pr-4 font-normal">Feature</th>
              <th className="py-2 pr-4 font-normal">What Otari reported</th>
              <th className="py-2 font-normal">Request ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.item} className="border-b border-line/60 align-top last:border-0">
                <td className="py-2 pr-4">
                  <span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${r.status === "proven" ? "bg-ok" : "bg-line"}`} />
                  {r.item}
                </td>
                <td className={`py-2 pr-4 ${r.status === "proven" ? "" : "text-muted"}`}>{r.proof}</td>
                <td className="num py-2 text-muted">{r.ids[0] ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import type { OtariTrace } from "@/lib/otari";
import type { Charge, Research, StepEvent, Totals } from "@/lib/pipeline";
import { SAMPLE_STATEMENT } from "@/lib/sample-statement";

type Step = Extract<StepEvent, { type: "step" }>;
type RunError = Extract<StepEvent, { type: "error" }>;

const MEMBERS = [
  { id: "alex", label: "Alex" },
  { id: "sam", label: "Sam" },
  { id: "jordan", label: "Jordan (teen)" },
];

const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const cents = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function Home() {
  const [statement, setStatement] = useState("");
  const [member, setMember] = useState("alex");
  const [skipRedaction, setSkipRedaction] = useState(false);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<Record<string, Step>>({});
  const [redaction, setRedaction] = useState<Record<string, number> | null>(null);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [research, setResearch] = useState<Research[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [traces, setTraces] = useState<OtariTrace[]>([]);
  const [errors, setErrors] = useState<RunError[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  function reset() {
    setSteps({});
    setRedaction(null);
    setCharges([]);
    setResearch([]);
    setTotals(null);
    setTraces([]);
    setErrors([]);
  }

  async function run() {
    reset();
    setRunning(true);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statement, member, skipRedaction }),
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        setErrors([{ type: "error", step: "run", code: String(res.status), message: body.error }]);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) if (line.trim()) handle(JSON.parse(line) as StepEvent);
      }
    } finally {
      setRunning(false);
    }
  }

  function handle(e: StepEvent) {
    if (e.type === "step") setSteps((s) => ({ ...s, [e.id]: e }));
    else if (e.type === "redaction") setRedaction(e.removed);
    else if (e.type === "charges") setCharges(e.charges);
    else if (e.type === "research") setResearch(e.research);
    else if (e.type === "totals") setTotals(e.totals);
    else if (e.type === "trace") setTraces((t) => [...t, e.trace]);
    else if (e.type === "error") setErrors((x) => [...x, e]);
  }

  const savings = totals
    ? totals.overlaps.reduce((a, o) => a + o.yearlyWaste, 0) + totals.feesYearly
    : 0;
  const otariCost = traces.reduce((a, t) => a + t.costUsd, 0);
  const researchFor = useMemo(() => {
    const map = new Map(research.map((r) => [r.service.toLowerCase(), r]));
    return (service: string) => map.get(service.toLowerCase());
  }, [research]);
  const blocked = errors.find((e) => e.code === "guardrail_violation");
  const started = Object.keys(steps).length > 0 || errors.length > 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Leak</h1>
          <span className="text-sm text-muted">built on Mozilla&apos;s Otari, open-weight models only</span>
        </div>
        <p className="mt-2 max-w-2xl text-lg text-muted">
          Drop in a bank statement. See every subscription and hidden fee, what it costs you a year, and how to cancel it.
          Account numbers are removed before any model sees them.
        </p>
      </header>

      <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="statement" className="font-medium">
            Bank statement (CSV or pasted text)
          </label>
          <button
            type="button"
            onClick={() => setStatement(SAMPLE_STATEMENT)}
            className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-background"
          >
            Use the sample statement
          </button>
        </div>
        <textarea
          id="statement"
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          placeholder="Date,Description,Amount&#10;2026-10-05,NETFLIX.COM,-17.99"
          className="h-40 w-full resize-y rounded-xl border border-line bg-background p-3 font-mono text-xs leading-relaxed outline-none focus:border-accent"
        />
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <fieldset className="flex items-center gap-2">
            <legend className="sr-only">Whose budget</legend>
            <span className="text-sm text-muted">Running as</span>
            {MEMBERS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMember(m.id)}
                aria-pressed={member === m.id}
                className={`rounded-full border px-3 py-1 text-sm ${
                  member === m.id ? "border-accent bg-accent-soft text-accent" : "border-line"
                }`}
              >
                {m.label}
              </button>
            ))}
          </fieldset>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={skipRedaction} onChange={(e) => setSkipRedaction(e.target.checked)} />
            Skip account-number stripping (test Otari&apos;s guardrail)
          </label>
          <button
            type="button"
            onClick={run}
            disabled={running || !statement.trim()}
            className="ml-auto rounded-xl bg-accent px-5 py-2.5 font-medium text-white disabled:opacity-40"
          >
            {running ? "Checking…" : "Find my leaks"}
          </button>
        </div>
      </section>

      <div ref={resultsRef} className="scroll-mt-6" />

      {started && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0 space-y-6">
            {blocked && (
              <div className="rounded-2xl border border-accent bg-accent-soft p-4">
                <p className="font-medium text-accent">Otari blocked this request before it reached a model.</p>
                <p className="mt-1 text-sm">
                  The statement still contained personal data, so the guardrail refused it. Turn account-number stripping back on.
                </p>
              </div>
            )}

            <ol className="space-y-2">
              {redaction && (
                <StepRow
                  status="done"
                  label="Removing account numbers and contact details"
                  detail={
                    Object.keys(redaction).length
                      ? Object.entries(redaction)
                          .map(([k, v]) => `${v} ${k.toLowerCase()}`)
                          .join(", ")
                      : "skipped"
                  }
                />
              )}
              {Object.values(steps).map((s) => (
                <StepRow key={s.id} status={s.status} label={s.label} detail={s.detail} />
              ))}
            </ol>

            {totals && (
              <section className="rounded-2xl border border-line bg-surface p-5">
                <p className="text-sm text-muted">You pay for {totals.count} subscriptions</p>
                <p className="mt-1 text-5xl font-semibold tracking-tight">
                  {usd(totals.yearly)}
                  <span className="text-xl font-normal text-muted"> a year</span>
                </p>
                <p className="mt-3 text-lg">
                  <span className="font-semibold text-accent">{usd(savings)} a year</span> goes on overlapping services and bank fees.
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {totals.overlaps.map((o) => (
                    <li key={o.group} className="flex justify-between gap-4 border-t border-line pt-2">
                      <span>
                        {o.services.length} {o.group} services ({o.services.join(", ")}). Keeping {o.keep} saves
                      </span>
                      <span className="font-medium tabular-nums">{usd(o.yearlyWaste)}/yr</span>
                    </li>
                  ))}
                  {totals.feesYearly > 0 && (
                    <li className="flex justify-between gap-4 border-t border-line pt-2">
                      <span>Bank fees, at this statement&apos;s rate</span>
                      <span className="font-medium tabular-nums">{usd(totals.feesYearly)}/yr</span>
                    </li>
                  )}
                  {totals.priceRises.map((p) => (
                    <li key={p.service} className="flex justify-between gap-4 border-t border-line pt-2 text-muted">
                      <span>
                        {p.service} went up from {cents(p.from)} to {cents(p.to)}
                      </span>
                      <span className="tabular-nums">+{usd(p.yearlyExtra)}/yr</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {charges.length > 0 && (
              <section className="overflow-x-auto rounded-2xl border border-line bg-surface">
                <table className="w-full text-left text-sm">
                  <thead className="text-muted">
                    <tr className="border-b border-line">
                      <th className="px-4 py-3 font-medium">What</th>
                      <th className="px-4 py-3 font-medium">You pay</th>
                      <th className="px-4 py-3 font-medium">Price today</th>
                      <th className="px-4 py-3 font-medium">Cancel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {charges.map((c) => {
                      const r = researchFor(c.service);
                      return (
                        <tr key={`${c.service}-${c.lastAmount}`} className="border-b border-line last:border-0 align-top">
                          <td className="px-4 py-3">
                            <div className="font-medium">{c.service}</div>
                            <div className="text-xs text-muted">{c.isFee ? "bank fee" : c.category}</div>
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {cents(c.lastAmount)}
                            {!c.isFee && <span className="text-muted">/{c.cadence === "yearly" ? "yr" : "mo"}</span>}
                          </td>
                          <td className="px-4 py-3">
                            {r?.currentPrice ?? <span className="text-muted">{c.isFee ? "" : "not checked"}</span>}
                            {r?.note && <div className="text-xs text-muted">{r.note}</div>}
                          </td>
                          <td className="px-4 py-3">
                            {r?.cancelUrl ? (
                              <a href={r.cancelUrl} target="_blank" rel="noreferrer" className="text-accent underline">
                                Cancel page
                              </a>
                            ) : (
                              <span className="text-muted">{c.isFee ? "Ask your bank" : ""}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            )}

            {errors
              .filter((e) => e.code !== "guardrail_violation")
              .map((e, i) => (
                <p key={i} className="text-sm text-muted">
                  {e.step}: {e.message}
                </p>
              ))}
          </div>

          <OtariPanel traces={traces} cost={otariCost} running={running} />
        </div>
      )}

      <footer className="mt-16 text-xs text-muted">
        Built for MozFest Developers Wilding. Every model call goes through{" "}
        <a className="underline" href="https://otari.ai" target="_blank" rel="noreferrer">
          Otari
        </a>
        . The sample statement is fictional.
      </footer>
    </main>
  );
}

function StepRow({ status, label, detail }: { status: Step["status"]; label: string; detail?: string }) {
  const dot =
    status === "done" ? "bg-ok" : status === "failed" ? "bg-accent" : status === "skipped" ? "bg-line" : "bg-accent animate-pulse";
  return (
    <li className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm">
      <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
      <span className="font-medium">{label}</span>
      {detail && <span className="ml-auto truncate text-muted">{detail}</span>}
    </li>
  );
}

function OtariPanel({ traces, cost, running }: { traces: OtariTrace[]; cost: number; running: boolean }) {
  return (
    <aside className="h-fit rounded-2xl border border-line bg-surface p-4 lg:sticky lg:top-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">What Otari did</h2>
        <span className="text-sm tabular-nums text-muted">${cost.toFixed(4)}</span>
      </div>
      <p className="mt-1 text-xs text-muted">Every request, as the gateway reported it.</p>
      {traces.length === 0 && <p className="mt-4 text-sm text-muted">{running ? "Waiting for the first request…" : ""}</p>}
      <ul className="mt-4 space-y-3">
        {traces.map((t, i) => (
          <li key={`${t.requestId}-${i}`} className="rounded-xl border border-line p-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium capitalize text-foreground">{t.step}</span>
              <span className="tabular-nums text-muted">
                {(t.ms / 1000).toFixed(1)}s · ${t.costUsd.toFixed(4)}
              </span>
            </div>
            <div className="mt-1 text-muted">
              {t.servedBy}
              {t.provider ? ` on ${t.provider}` : ""}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {t.model.startsWith("leak-") && <Tag>routing policy {t.model}</Tag>}
              {t.fallback && <Tag accent>fallback served it</Tag>}
              {t.guardrails && <Tag>guardrail: {guardrailSummary(t.guardrails)}</Tag>}
              {t.endUserBudget && <Tag>member budget</Tag>}
              {t.toolCalls.map((c, j) => (
                <Tag key={j}>
                  {c.type.replace("_", " ")}
                  {c.query ? `: ${c.query}` : c.url ? `: ${new URL(c.url).hostname}` : ""}
                </Tag>
              ))}
            </div>
            {t.toolCalls
              .filter((c) => c.type === "code_execution" && c.code)
              .map((c, j) => (
                <details key={j} className="mt-2">
                  <summary className="cursor-pointer text-muted">Python it ran</summary>
                  <pre className="mt-1 max-h-48 overflow-auto rounded bg-background p-2 font-mono text-[10px]">{c.code}</pre>
                </details>
              ))}
          </li>
        ))}
      </ul>
    </aside>
  );
}

function Tag({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={`max-w-full truncate rounded-full border px-2 py-0.5 ${
        accent ? "border-accent text-accent" : "border-line text-muted"
      }`}
    >
      {children}
    </span>
  );
}

function guardrailSummary(header: string) {
  try {
    const parsed = JSON.parse(header) as { status?: string; valid?: boolean }[];
    return parsed.map((g) => (g.valid === false ? "flagged" : (g.status ?? "checked"))).join(", ");
  } catch {
    return "checked";
  }
}

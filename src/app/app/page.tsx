"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AiSaw } from "@/components/AiSaw";
import { CountUp } from "@/components/CountUp";
import { Household, type Member } from "@/components/Household";
import { LeakCards, monthlyCost } from "@/components/LeakCards";
import { Pipeline, type NodeState, type PipelineNode } from "@/components/Pipeline";
import type { OtariTrace } from "@/lib/otari";
import type { Charge, Research, StepEvent, Totals } from "@/lib/pipeline";
import { SAMPLE_STATEMENT } from "@/lib/sample-statement";

type Step = Extract<StepEvent, { type: "step" }>;
type RunError = Extract<StepEvent, { type: "error" }>;
type Redaction = Extract<StepEvent, { type: "redaction" }>;

const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function Home() {
  const [statement, setStatement] = useState("");
  const [sent, setSent] = useState("");
  const [member, setMember] = useState("alex");
  const [skipRedaction, setSkipRedaction] = useState(false);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<Record<string, Step>>({});
  const [redaction, setRedaction] = useState<Redaction | null>(null);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [research, setResearch] = useState<Research[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [traces, setTraces] = useState<OtariTrace[]>([]);
  const [errors, setErrors] = useState<RunError[]>([]);
  const [plugged, setPlugged] = useState<Set<string>>(new Set());
  const [members, setMembers] = useState<{ configured: boolean; members: Member[] }>({ configured: false, members: [] });
  const resultsRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadMembers = useCallback(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then(setMembers)
      .catch(() => {});
  }, []);
  useEffect(loadMembers, [loadMembers]);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("sample")) setStatement(SAMPLE_STATEMENT);
  }, []);

  async function run() {
    setSteps({});
    setRedaction(null);
    setCharges([]);
    setResearch([]);
    setTotals(null);
    setTraces([]);
    setErrors([]);
    setPlugged(new Set());
    setSent(statement);
    setRunning(true);
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
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
      loadMembers();
    }
  }

  function handle(e: StepEvent) {
    if (e.type === "step") setSteps((s) => ({ ...s, [e.id]: e }));
    else if (e.type === "redaction") setRedaction(e);
    else if (e.type === "charges") setCharges(e.charges);
    else if (e.type === "research") setResearch(e.research);
    else if (e.type === "trace") setTraces((t) => [...t, e.trace]);
    else if (e.type === "error") setErrors((x) => [...x, e]);
    else if (e.type === "totals") {
      setTotals(e.totals);
      // Start with the overlapping services already plugged: the obvious savings, ready to keep or undo.
      setPlugged(new Set(e.totals.overlaps.flatMap((o) => o.services.filter((s) => s !== o.keep))));
    }
  }

  const addTrace = useCallback(
    (t: OtariTrace) => {
      setTraces((x) => [...x, t]);
      loadMembers();
    },
    [loadMembers],
  );

  const toggle = (service: string) =>
    setPlugged((p) => {
      const next = new Set(p);
      if (next.has(service)) next.delete(service);
      else next.add(service);
      return next;
    });

  const yearlySaved = useMemo(
    () => charges.filter((c) => !c.isFee && plugged.has(c.service)).reduce((a, c) => a + monthlyCost(c) * 12, 0),
    [charges, plugged],
  );

  const blocked = errors.find((e) => e.code === "guardrail_violation");
  const budgetOut = errors.find((e) => /budget/i.test(e.code));
  const nodes = useMemo(
    () => buildNodes({ steps, traces, errors, redaction, running }),
    [steps, traces, errors, redaction, running],
  );
  const started = running || Object.keys(steps).length > 0 || errors.length > 0;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent">The app</p>
          <h1 className="mt-2 text-3xl font-light tracking-tight sm:text-5xl">Check a statement</h1>
          <p className="mt-2 max-w-xl text-muted">
            Paste a CSV export from your bank, or try the fictional sample. Account numbers are stripped before any model sees it.
          </p>
        </div>
      </header>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="rounded-2xl border border-line bg-surface/80 p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="statement" className="text-sm text-muted">
              Bank statement, CSV or pasted text
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-lg border border-line px-3 py-1.5 text-xs hover:border-muted"
              >
                Open a CSV
              </button>
              <button
                type="button"
                onClick={() => setStatement(SAMPLE_STATEMENT)}
                className="rounded-lg border border-accent/50 px-3 py-1.5 text-xs text-accent hover:bg-accent-soft"
              >
                Try the sample
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.txt,text/csv,text/plain"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) setStatement(await f.text());
                  e.target.value = "";
                }}
              />
            </div>
          </div>
          <textarea
            id="statement"
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder={"Date,Description,Amount\n2026-10-05,NETFLIX.COM,-17.99"}
            spellCheck={false}
            className="num h-44 w-full resize-y rounded-xl border border-line bg-background/70 p-3 text-xs leading-relaxed outline-none placeholder:text-muted/50 focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface/80 p-4">
          <span className="text-sm text-muted">Who is checking</span>
          <Household member={member} onPick={setMember} members={members.members} configured={members.configured} />
          <label className="mt-1 flex items-start gap-2 text-xs text-muted">
            <input
              type="checkbox"
              className="mt-0.5 accent-[var(--accent)]"
              checked={skipRedaction}
              onChange={(e) => setSkipRedaction(e.target.checked)}
            />
            <span>Send it unstripped, to watch Otari&apos;s guardrail stop it</span>
          </label>
          <button
            type="button"
            onClick={run}
            disabled={running || !statement.trim()}
            className="mt-auto pill-white px-5 py-3 font-medium transition disabled:opacity-30 disabled:shadow-none"
          >
            {running ? "Tracing the leaks…" : "Find my leaks"}
          </button>
        </div>
      </section>

      <div ref={resultsRef} className="scroll-mt-6" />

      {started && (
        <div className="mt-8 space-y-6">
          <Pipeline nodes={nodes} />

          {blocked && (
            <div className="fade-up rounded-2xl border border-danger/60 bg-danger/10 p-4">
              <p className="font-medium text-danger">Otari&apos;s guardrail stopped this statement before any model saw it.</p>
              <p className="mt-1 text-sm text-muted">It still carried personal data. Turn stripping back on and run it again.</p>
            </div>
          )}
          {budgetOut && !blocked && (
            <div className="fade-up rounded-2xl border border-accent/60 bg-accent-soft p-4">
              <p className="font-medium text-accent">This member&apos;s AI allowance is used up for today.</p>
              <p className="mt-1 text-sm text-muted">Otari refused the request at their budget. Pick another member or come back tomorrow.</p>
            </div>
          )}

          {redaction && <AiSaw raw={sent} redacted={redaction.text} removed={redaction.removed} skipped={redaction.skipped} />}

          {totals && (
            <section className="fade-up grid gap-4 md:grid-cols-3">
              <Stat label={`You pay for ${totals.count} subscriptions`} value={totals.yearly} suffix="a year" />
              <Stat label="Plugged so far" value={yearlySaved} suffix="a year back" accent hint="Flip the switches below" />
              <Stat
                label="Bank fees, at this statement's rate"
                value={totals.feesYearly}
                suffix="a year"
                hint={totals.priceRises.map((p) => `${p.service} +${usd(p.yearlyExtra)}/yr`).join(" · ") || undefined}
                hintLabel={totals.priceRises.length ? "Price rises" : undefined}
              />
            </section>
          )}

          {charges.length > 0 && (
            <LeakCards
              charges={charges}
              research={research}
              plugged={plugged}
              onToggle={toggle}
              member={member}
              onTrace={addTrace}
            />
          )}

          {errors
            .filter((e) => e.code !== "guardrail_violation" && !/budget/i.test(e.code))
            .map((e, i) => (
              <p key={i} className="text-xs text-muted">
                {e.step}: {e.message}
              </p>
            ))}
        </div>
      )}

    </main>
  );
}

function Stat({
  label,
  value,
  suffix,
  accent,
  hint,
  hintLabel,
}: {
  label: string;
  value: number;
  suffix: string;
  accent?: boolean;
  hint?: string;
  hintLabel?: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "border-accent/60 bg-accent-soft" : "border-line bg-surface/80"}`}>
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className={`num mt-2 text-4xl font-semibold ${accent ? "text-accent" : ""}`}>
        <CountUp value={value} format={usd} />
      </p>
      <p className="mt-1 text-sm text-muted">{suffix}</p>
      {hint && (
        <p className="mt-3 text-xs text-muted">
          {hintLabel && <span className="text-foreground">{hintLabel}: </span>}
          {hint}
        </p>
      )}
    </div>
  );
}

function buildNodes({
  steps,
  traces,
  errors,
  redaction,
  running,
}: {
  steps: Record<string, Step>;
  traces: OtariTrace[];
  errors: RunError[];
  redaction: Redaction | null;
  running: boolean;
}): PipelineNode[] {
  const of = (prefix: string) => traces.filter((t) => t.step.startsWith(prefix));
  const stepState = (id: string): NodeState => {
    const s = steps[id];
    if (!s) return "idle";
    return s.status === "skipped" ? "off" : s.status;
  };
  const blocked = errors.some((e) => e.code === "guardrail_violation");
  const guarded = traces.find((t) => t.guardrails);
  const modelTraces = traces.filter((t) => t.model !== "sandbox");

  let guard: NodeState = "idle";
  let guardNote = "waiting";
  if (blocked) {
    guard = "blocked";
    guardNote = "refused: personal data found";
  } else if (guarded) {
    guard = "done";
    guardNote = "checked every request";
  } else if (modelTraces.length > 0) {
    guard = "off";
    guardNote = "no guardrail mandated on this workspace yet";
  } else if (running && redaction) guard = "running";

  const extract = of("extract");
  const fallback = extract.find((t) => t.fallback);
  const drafts = of("draft");

  const nodes: PipelineNode[] = [
    {
      id: "strip",
      title: "Strip identifiers",
      feature: "privacy",
      model: "runs before Otari",
      state: redaction ? (redaction.skipped ? "off" : "done") : running ? "running" : "idle",
      note: redaction
        ? redaction.skipped
          ? "skipped on purpose"
          : `${Object.values(redaction.removed).reduce((a, b) => a + b, 0)} removed`
        : undefined,
      traces: [],
    },
    { id: "guard", title: "Guardrail", feature: "guardrails", model: "PII check at the gateway", state: guard, note: guardNote, traces: guarded ? [guarded] : [] },
    {
      id: "extract",
      title: "Find charges",
      feature: fallback ? "routing · fallback" : "model 1",
      model: extract[0]?.servedBy ?? "Qwen 3.5 35B",
      state: blocked && !extract.length ? "blocked" : stepState("extract"),
      traces: extract,
    },
    {
      id: "research",
      title: "Check prices",
      feature: "model 2 · web",
      model: of("research")[0]?.servedBy ?? "DeepSeek V4 Flash",
      state: stepState("research"),
      note: steps.research?.detail,
      traces: of("research"),
    },
    { id: "sandbox", title: "Add it up", feature: "code execution", model: "Otari sandbox", state: stepState("totals"), traces: of("totals") },
  ];
  if (drafts.length) {
    nodes.push({ id: "draft", title: "Write the fix", feature: "model 3", model: drafts[0].servedBy ?? "Ministral 8B", state: "done", traces: drafts });
  }
  return nodes;
}

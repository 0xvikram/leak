import type { Metadata } from "next";
import Link from "next/link";
import { PoweredByOtari, REPO } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "How it works" };

const STAGES = [
  {
    title: "Strip identifiers",
    where: "In the app, before any request",
    model: null,
    feature: "Privacy",
    what: "Regular expressions replace account, card, routing and IBAN numbers, email addresses and phone numbers with tags like [card]. The stripped text is what every later step sees, and the page shows it to you.",
    numbers: "4 identifiers removed from the sample · under 1 ms",
    code: "src/lib/redact.ts",
  },
  {
    title: "Guardrail at the gateway",
    where: "Otari, on every model request",
    model: "Lakera Guard PII check",
    feature: "Guardrails",
    what: "A PII guardrail is mandated on the Otari workspace in block mode. If a statement still carries personal data, Otari refuses it with guardrail_violation before any provider sees it. Tick \"send it unstripped\" in the app to watch it happen.",
    numbers: "Verdict shown on each request in the glass box",
    code: "src/lib/otari.ts (otariError, Otari-Guardrails header)",
  },
  {
    title: "Find the charges",
    where: "Otari → open-weight model 1",
    model: "Qwen 3.5 35B (fallback: GPT-OSS 20B)",
    feature: "Routing and fallback",
    what: "The stripped statement goes to Qwen with reasoning off and JSON output on. It returns each recurring service and bank fee, grouped, with the amounts it was charged. The request names a failover policy, so Otari moves to the backup model if Qwen's provider fails.",
    numbers: "15 charges found on the sample · about 15 s · $0.002",
    code: "src/lib/pipeline.ts (extract step)",
  },
  {
    title: "Check prices on the web",
    where: "Otari → open-weight model 2, with Otari's web tools",
    model: "DeepSeek V4 Flash",
    feature: "Web search and fetch",
    what: "Subscriptions go out in batches of three, in parallel. DeepSeek uses Otari's web search (and fetch when a page is needed) to find each service's price today and the official cancel page, treating every page as data, never as instructions.",
    numbers: "12 of 12 services checked, 12 cancel links · 20 to 30 s per batch · about $0.09 a batch",
    code: "src/lib/pipeline.ts (researchBatch)",
  },
  {
    title: "Add it up in the sandbox",
    where: "Otari code execution, no model",
    model: "Python in Otari's sandbox",
    feature: "Code execution",
    what: "The app writes the arithmetic as a Python program (monthly and yearly totals, overlapping services in the same category, price rises, fees on a yearly footing) and runs it in Otari's sandbox. The headline number is computed, not generated.",
    numbers: "$2,938 a year · $516 in overlaps · $297 in fees · about 1 s · $0.01",
    code: "src/lib/pipeline.ts (totalsProgram) · src/lib/otari.ts (runCode)",
  },
  {
    title: "Write the fix",
    where: "Otari → open-weight model 3, when you plug a leak",
    model: "Ministral 8B",
    feature: "Models in distinct roles",
    what: "Flip a subscription to plug and Ministral writes the cancellation message, adding the cancel link when one was found. For a bank fee it writes a polite refund request.",
    numbers: "About 2 s · $0.00003 a draft",
    code: "src/app/api/draft/route.ts",
  },
];

export default function HowItWorks() {
  return (
    <main className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
      <PoweredByOtari />
      <h1 className="mt-5 text-4xl font-light tracking-[-0.02em] sm:text-6xl">How Leak works</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Six stages, three open-weight models, and every model request routed through Mozilla&apos;s Otari gateway. The numbers below are from
        the sample statement.
      </p>

      <div className="mt-6 flex flex-wrap gap-2 text-xs">
        {["Statement", "Strip", "Guardrail", "Qwen", "DeepSeek + web", "Sandbox", "Ministral", "Plugged"].map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            {i > 0 && <span className="h-px w-4 bg-accent/60" />}
            <span className={`rounded-full border px-3 py-1 ${i === 0 || i === 7 ? "border-accent/60 text-accent" : "border-line"}`}>{s}</span>
          </span>
        ))}
      </div>

      <ol className="relative mt-12 space-y-6 border-l border-line pl-8">
        {STAGES.map((s, i) => (
          <li key={s.title} className="relative">
            <span className="num absolute -left-[45px] top-4 flex h-7 w-7 items-center justify-center rounded-full border border-accent/60 bg-background text-xs text-accent">
              {i + 1}
            </span>
            <div className="rounded-2xl border border-line bg-surface/80 p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xl font-medium">{s.title}</h2>
                <span className="rounded-full border border-line px-2.5 py-0.5 text-xs text-accent">Otari: {s.feature}</span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {s.where}
                {s.model && <> · <span className="num text-foreground">{s.model}</span></>}
              </p>
              <p className="mt-3 leading-relaxed">{s.what}</p>
              <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-line pt-3 text-xs">
                <span className="num text-ok">{s.numbers}</span>
                <span className="num text-muted">{s.code}</span>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-16 grid gap-4 md:grid-cols-3">
        {[
          ["About a minute", "for a three-month statement, end to end"],
          ["30 to 40 cents", "of Otari credit a check, mostly web searches"],
          ["Every call streamed", "so long web research never hits a timeout"],
        ].map(([v, l]) => (
          <div key={v} className="rounded-2xl border border-line bg-surface/80 p-5">
            <div className="text-xl font-semibold text-accent">{v}</div>
            <div className="mt-1 text-sm text-muted">{l}</div>
          </div>
        ))}
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/app?sample=1" className="pill-white px-5 py-3 font-medium ">
          Watch it run on the sample
        </Link>
        <Link href="/otari" className="rounded-full border border-line bg-surface px-5 py-3 font-medium hover:border-muted">
          How Leak uses Otari
        </Link>
        <a href={REPO} target="_blank" rel="noreferrer" className="rounded-full border border-line bg-surface px-5 py-3 font-medium hover:border-muted">
          Read the code
        </a>
      </div>
    </main>
  );
}

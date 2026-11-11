import type { Metadata } from "next";
import Link from "next/link";
import { OTARI, PoweredByOtari, REPO } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Powered by Otari" };

const FEATURES = [
  {
    name: "Open-weight models",
    how: "Every model Leak calls is open-weight: Qwen 3.5 35B, DeepSeek V4 Flash and Ministral 8B, all through one Otari key.",
    file: "src/lib/otari.ts",
  },
  {
    name: "Models in distinct roles",
    how: "Qwen reads the statement, DeepSeek researches the web, Ministral writes the cancellation. Each is the cheapest model that does its job well.",
    file: "src/lib/pipeline.ts",
  },
  {
    name: "Web search and fetch",
    how: "DeepSeek calls otari_web_search and otari_web_fetch to find today's price and the cancel page for each subscription.",
    file: "src/lib/pipeline.ts",
  },
  {
    name: "Code execution",
    how: "The totals, overlaps and price rises are a Python program the app sends to Otari's sandbox, so the headline number is exact.",
    file: "src/lib/otari.ts",
  },
  {
    name: "Guardrails",
    how: "A PII guardrail mandated on the workspace blocks any statement that still carries personal data. The verdict arrives in the Otari-Guardrails header and is shown on each request.",
    file: "src/lib/otari.ts",
  },
  {
    name: "Per-user budgets",
    how: "Alex, Sam and Jordan are end users of one service key, each with a daily budget of their own. The app reads their spend back from Otari and shows it as an allowance meter.",
    file: "src/app/api/members/route.ts",
  },
  {
    name: "Budgets and spend limits",
    how: "The app's key has a spend ceiling, so a public demo can never run away with the credit. A per-visitor run limit sits in front of it.",
    file: "src/app/api/analyze/route.ts",
  },
  {
    name: "Routing and fallback",
    how: "The extract step names the leak-extract failover policy instead of a model: Qwen first, GPT-OSS 20B if Qwen's provider fails. The glass box shows when the backup answered.",
    file: "src/lib/otari.ts",
  },
];

const HEADERS = [
  ["Otari-Model", "which model actually answered"],
  ["Otari-Provider", "which provider served it"],
  ["Otari-Fallback", "whether a backup took over"],
  ["Otari-Guardrails", "the guardrail's verdict"],
  ["Otari-End-User-Budget", "whose budget paid"],
  ["usage.cost_usd", "what the request cost"],
];

export default function PoweredByOtariPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
      <PoweredByOtari />
      <h1 className="mt-5 text-4xl font-light tracking-[-0.02em] sm:text-6xl">Built on Mozilla&apos;s Otari</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        <a href={OTARI} target="_blank" rel="noreferrer" className="text-foreground underline decoration-line underline-offset-4">
          Otari
        </a>{" "}
        is Mozilla.ai&apos;s open-source AI gateway: one endpoint for many models, with keys, budgets, guardrails and built-in tools. Every
        request Leak makes to a model goes through hosted otari.ai.
      </p>

      <section className="mt-12">
        <h2 className="text-xs uppercase tracking-[0.2em] text-accent">Eight Otari features, all in use</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.name} className="rounded-2xl border border-line bg-surface/80 p-5">
              <h3 className="font-medium">{f.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.how}</p>
              <a href={`${REPO}/blob/devs-wilding/${f.file}`} target="_blank" rel="noreferrer" className="num mt-3 inline-block text-xs text-accent hover:underline">
                {f.file} ↗
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-light tracking-tight sm:text-3xl">Why a gateway makes Leak trustworthy</h2>
          <p className="mt-3 text-muted">
            A money app should be able to say exactly which model saw your data and what it did. Otari reports that on every response, and
            Leak shows it to you in the glass box instead of hiding it.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface/80 p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted">What Otari tells the app on each request</h3>
          <dl className="mt-4 space-y-2 text-sm">
            {HEADERS.map(([h, d]) => (
              <div key={h} className="flex justify-between gap-4 border-b border-line pb-2 last:border-0">
                <dt className="num text-accent">{h}</dt>
                <dd className="text-right text-muted">{d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-light tracking-tight sm:text-3xl">Giving back to Otari</h2>
        <div className="mt-5 rounded-2xl border border-ok/40 bg-surface/80 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <a
              href="https://github.com/mozilla-ai/otari/pull/3039"
              target="_blank"
              rel="noreferrer"
              className="num font-medium hover:text-accent"
            >
              mozilla-ai/otari#3039 ↗
            </a>
            <span className="rounded-full bg-ok/15 px-3 py-0.5 text-xs text-ok">Merged</span>
          </div>
          <p className="mt-2 text-sm text-muted">
            A model sometimes called code execution with no code, and Otari reported the empty run as completed. Now the call is refused, the
            model is told to try again, it is never billed, and it shows as failed. Found while building Leak.
          </p>
        </div>
        <h3 className="mt-8 font-medium">What building on hosted Otari taught us</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>· A request that sends nothing back for 30 seconds is cut off, so every Leak call streams.</li>
          <li>· Past a web search max_uses cap, a model can keep calling and the loop ends in a 422, so Leak batches instead of capping.</li>
          <li>· Streamed DeepSeek code calls reached the sandbox with empty code, which led to the PR above.</li>
        </ul>
      </section>

      <div className="mt-14 flex flex-wrap gap-3">
        <Link href="/app?sample=1" className="pill-white px-5 py-3 font-medium ">
          See it in the glass box
        </Link>
        <a href={OTARI} target="_blank" rel="noreferrer" className="rounded-full border border-line bg-surface px-5 py-3 font-medium hover:border-muted">
          otari.ai
        </a>
        <a href="https://github.com/mozilla-ai/otari" target="_blank" rel="noreferrer" className="rounded-full border border-line bg-surface px-5 py-3 font-medium hover:border-muted">
          Otari on GitHub
        </a>
      </div>
    </main>
  );
}

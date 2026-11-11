import Link from "next/link";
import { DotDrop } from "@/components/DotDrop";
import { PoweredByOtari } from "@/components/SiteChrome";

const STEPS = [
  {
    n: "01",
    title: "Drop in a statement",
    body: "Export a CSV from your bank, or paste the text. Any bank, any layout: the model reads it the way you would.",
  },
  {
    n: "02",
    title: "Your details come out first",
    body: "Account, card and routing numbers, email and phone are stamped out before anything leaves the server. Otari's guardrail is the second lock.",
  },
  {
    n: "03",
    title: "Three open models trace the leaks",
    body: "One finds every subscription and fee, one checks today's price and the cancel page on the web, and Otari's sandbox adds it up exactly.",
  },
  {
    n: "04",
    title: "Plug them in one click",
    body: "Flip a switch on what you don't need and watch the yearly savings roll. Leak writes the cancellation or the fee-refund email for you.",
  },
];

const MODELS = [
  { name: "Qwen 3.5 35B", role: "Reads the statement", detail: "Finds recurring charges and bank fees, grouped by service, as structured data." },
  { name: "DeepSeek V4 Flash", role: "Checks the web", detail: "Uses Otari's web search to find today's price and the official cancel page." },
  { name: "Ministral 8B", role: "Writes the fix", detail: "Drafts the cancellation message or the fee-refund request you can paste and send." },
];

const OTARI_FEATURES = [
  "Open-weight models",
  "Models in distinct roles",
  "Web search & fetch",
  "Code execution",
  "Guardrails",
  "Per-user budgets",
  "Spend limits",
  "Routing & fallback",
];

const FAQ = [
  {
    q: "Is my statement stored?",
    a: "Leak keeps nothing: there is no database. The stripped statement passes through Otari to the open-weight model providers to be read; Otari records each request's tokens and cost, not your account numbers, which were removed first.",
  },
  {
    q: "Which banks work?",
    a: "Any bank that exports a CSV or a text statement. There is no bank-specific parser; the model reads descriptions like NETFLIX.COM 866-579 the way a person would.",
  },
  {
    q: "Why open-weight models?",
    a: "They can be run by anyone, audited and self-hosted. Leak uses three of them through one Otari key, and the page shows which one answered every request.",
  },
  {
    q: "How are the totals worked out?",
    a: "Not by a model. The app writes the arithmetic as Python and runs it in Otari's code sandbox, so the yearly number is exact and repeatable.",
  },
  {
    q: "What does a check cost?",
    a: "About 30 to 40 cents of Otari credit for a three-month statement, mostly web searches. Extracting the charges costs a fifth of a cent.",
  },
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pt-16 text-center sm:px-6 sm:pt-24">
        <div className="flex justify-center">
          <PoweredByOtari />
        </div>
        <h1 className="mx-auto mt-8 max-w-4xl text-5xl font-light leading-[1.08] tracking-[-0.02em] sm:text-6xl lg:text-7xl">
          Your money is <span className="grad-text font-normal">leaking</span>
          <span className="text-muted">.</span>
          <br />
          <span className="text-muted">Find out where,</span> and plug it.
        </h1>
        <p className="num mx-auto mt-6 max-w-xl text-sm leading-relaxed text-muted">
          every subscription and hidden fee in your bank statement - what it costs a year
          <br className="hidden sm:block" /> and how to cancel - without your account numbers ever reaching a model
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/app?sample=1" className="pill-white px-6 py-3 text-sm font-medium">
            See it in action →
          </Link>
          <Link href="/app" className="rounded-full border border-line bg-surface px-6 py-3 text-sm font-medium hover:border-muted">
            Check my statement
          </Link>
        </div>
        <div className="mt-6 -mb-10">
          <DotDrop />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">On a real-looking statement</p>
            <h2 className="mt-3 text-4xl font-light tracking-tight">
              12 subscriptions. <span className="text-muted">$516 a year paid twice for the same job.</span>
            </h2>
            <p className="mt-4 max-w-md text-muted">
              Three months of a fictional household&apos;s spending, checked in about a minute. Flip a switch on anything you don&apos;t need and Leak
              writes the cancellation for you.
            </p>
          </div>
          <HeroCard />
        </div>
      </section>

      {/* Numbers */}
      <section className="border-y border-line bg-surface/60">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4">
          {[
            ["$2,938", "a year in subscriptions found on the sample"],
            ["$516", "a year paid twice for the same job"],
            ["$297", "a year in bank fees"],
            ["0", "account numbers sent to a model"],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="num grad-text text-3xl font-medium">{v}</div>
              <div className="mt-1 text-sm text-muted">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHead eyebrow="How it works" title="From statement to plugged leaks in about a minute" link={{ href: "/how-it-works", label: "The full pipeline" }} />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-line bg-surface/80 p-5">
              <div className="num text-sm text-accent">{s.n}</div>
              <h3 className="mt-3 font-medium">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section id="privacy" className="scroll-mt-20 border-y border-line bg-surface/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div>
            <SectionHead eyebrow="Privacy" title="See exactly what the AI saw" />
            <p className="mt-4 text-muted">
              Most money apps ask you to trust them with your bank data. Leak shows you the statement exactly as it was sent, with every identifier
              stamped out, next to your original.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                ["Stripped in the app", "Account, card, routing and IBAN numbers, email and phone are removed before any request is made."],
                ["Checked at the gateway", "An Otari guardrail blocks a statement that still carries personal data, before it reaches a provider."],
                ["Nothing kept", "Leak has no database. Close the tab and it is gone."],
                ["Every request visible", "The glass box lists each model call: who served it, what it cost, what it searched."],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ok" />
                  <span>
                    <span className="font-medium">{t}.</span> <span className="text-muted">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <Snippet label="Your file" lines={["Statement for Alex Rivera | Acct No. 4417-2290-1185-0063", "Contact: alex.rivera@example.com | +1 415 555 0142", "2026-10-05,\"NETFLIX.COM\",-17.99"]} />
            <Snippet
              label="Sent to the model"
              accent
              lines={["Statement for Alex Rivera | Acct No. [card]", "Contact: [email] | [phone]", "2026-10-05,\"NETFLIX.COM\",-17.99"]}
            />
          </div>
        </div>
      </section>

      {/* Models */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHead eyebrow="Open-weight models" title="Three models, three jobs, one key" />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {MODELS.map((m) => (
            <div key={m.name} className="rounded-2xl border border-line bg-surface/80 p-5">
              <div className="text-xs uppercase tracking-wider text-accent">{m.role}</div>
              <div className="num mt-2 text-lg">{m.name}</div>
              <p className="mt-2 text-sm text-muted">{m.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Powered by Otari */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-8 sm:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <PoweredByOtari />
              <h2 className="mt-4 text-3xl font-light tracking-tight sm:text-4xl">Every request goes through <span className="grad-text">Otari</span></h2>
              <p className="mt-3 text-muted">
                Otari is Mozilla.ai&apos;s open-source AI gateway. It gives Leak one key for every open-weight model, web search, a code sandbox,
                guardrails and a budget for each person in the household, and tells the app exactly what happened on each request.
              </p>
              <Link href="/otari" className="mt-5 inline-block text-sm text-accent hover:underline">
                How Leak uses each Otari feature →
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {OTARI_FEATURES.map((f) => (
                <span key={f} className="rounded-full border border-line bg-raised px-3 py-1.5 text-sm">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <SectionHead eyebrow="Questions" title="Good to know" />
        <div className="mt-8 divide-y divide-line rounded-2xl border border-line bg-surface/80">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {f.q}
                <span className="text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl border border-accent/40 bg-accent-soft p-10 text-center">
          <h2 className="text-3xl font-light tracking-tight sm:text-4xl">How much is leaking out of yours?</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">It takes about a minute. Start with the sample if you&apos;d rather not use your own.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/app?sample=1" className="pill-white px-5 py-3 font-medium ">
              Try the sample
            </Link>
            <Link href="/app" className="rounded-full border border-line bg-surface px-5 py-3 font-medium hover:border-muted">
              Check my statement
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function SectionHead({ eyebrow, title, link }: { eyebrow: string; title: string; link?: { href: string; label: string } }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-light tracking-tight sm:text-4xl">{title}</h2>
      </div>
      {link && (
        <Link href={link.href} className="text-sm text-muted hover:text-accent">
          {link.label} →
        </Link>
      )}
    </div>
  );
}

function Snippet({ label, lines, accent }: { label: string; lines: string[]; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-accent/50 bg-background" : "border-line bg-background/70"}`}>
      <div className={`text-xs uppercase tracking-wider ${accent ? "text-accent" : "text-muted"}`}>{label}</div>
      <pre className="num mt-3 overflow-x-auto text-[11px] leading-6">
        {lines.map((l) => (
          <div key={l}>
            {l.split(/(\[[a-z]+\])/g).map((p, i) =>
              /^\[[a-z]+\]$/.test(p) ? (
                <span key={i} className="redacted">
                  {p.slice(1, -1)}
                </span>
              ) : (
                p
              ),
            )}
          </div>
        ))}
      </pre>
    </div>
  );
}

function HeroCard() {
  const rows = [
    ["Netflix", "streaming video", "17.99", true],
    ["Hulu", "streaming video", "18.99", false],
    ["Disney+", "streaming video", "13.99", true],
    ["Apple Music", "music", "10.99", true],
    ["Overdraft fee", "bank fee", "35.00", true],
  ] as const;
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-accent/10 blur-2xl" />
      <div className="relative rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="uppercase tracking-wider">Sample statement · 3 months</span>
          <span className="num">12 found</span>
        </div>
        <div className="num mt-3 text-4xl font-semibold">
          $2,938<span className="text-base font-normal text-muted"> a year</span>
        </div>
        <div className="mt-1 text-sm">
          <span className="text-accent">$516 a year</span> <span className="text-muted">on overlapping services</span>
        </div>
        <ul className="mt-5 space-y-2">
          {rows.map(([name, cat, price, leak]) => (
            <li key={name} className="flex items-center justify-between rounded-lg border border-line bg-raised px-3 py-2 text-sm">
              <span>
                <span className={leak ? "text-muted line-through" : ""}>{name}</span>
                <span className="ml-2 text-xs text-muted">{cat}</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="num">${price}</span>
                <span className={`relative h-4 w-7 rounded-full ${leak ? "bg-accent" : "bg-ok/70"}`}>
                  <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-background ${leak ? "left-0.5" : "left-3.5"}`} />
                </span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center gap-1.5 text-[10px] text-muted">
          {["strip", "guard", "qwen", "deepseek + web", "sandbox", "ministral"].map((s, i) => (
            <span key={s} className="flex items-center gap-1.5">
              {i > 0 && <span className="h-px w-3 bg-ok/50" />}
              <span className="rounded border border-ok/40 px-1.5 py-0.5">{s}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

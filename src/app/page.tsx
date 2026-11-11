import Link from "next/link";
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
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <PoweredByOtari />
            <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">MozFest Developers Wilding</span>
          </div>
          <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Your bank account is <span className="text-accent">leaking</span>. Find out where.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Drop in a bank statement. Leak finds every subscription and hidden fee, what it costs you a year and how to cancel it. Your account
            numbers never reach a model.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/app?sample=1"
              className="rounded-xl bg-accent px-5 py-3 font-medium text-[#1a1206] shadow-[0_0_30px_rgba(255,154,60,0.3)] hover:brightness-110"
            >
              Try it with a sample statement
            </Link>
            <Link href="/app" className="rounded-xl border border-line px-5 py-3 font-medium hover:border-muted">
              Check my own statement
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted">Free to try · no sign-up · open-weight models only</p>
        </div>

        <HeroCard />
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
              <div className="num text-3xl font-semibold text-accent">{v}</div>
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
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">Every request goes through Otari</h2>
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
          <h2 className="text-3xl font-semibold tracking-tight">How much is leaking out of yours?</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">It takes about a minute. Start with the sample if you&apos;d rather not use your own.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/app?sample=1" className="rounded-xl bg-accent px-5 py-3 font-medium text-[#1a1206] hover:brightness-110">
              Try the sample
            </Link>
            <Link href="/app" className="rounded-xl border border-line bg-background px-5 py-3 font-medium hover:border-muted">
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
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h2>
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

# Leak

Drop in a bank statement and see every subscription and hidden fee, what it costs you a year, and how to cancel it. Account numbers are removed before any model sees them.

Built for [MozFest Developers Wilding](https://otari.ai/devs-wilding). Every model call goes through hosted [Otari](https://otari.ai), Mozilla.ai's open-source AI gateway, and every model is open-weight.

**Live:** https://leak-otari.vercel.app · the app at [/app](https://leak-otari.vercel.app/app?sample=1) (the sample statement is fictional) · [How it works](https://leak-otari.vercel.app/how-it-works) · [Powered by Otari](https://leak-otari.vercel.app/otari)

On the sample, Leak finds 12 subscriptions costing $2,938 a year, $516 a year spent on overlapping video and music services, and $297 a year in bank fees. A full run costs about one cent of Otari credit.

## For judges

| | |
| --- | --- |
| Try it | [leak-otari.vercel.app/app?sample=1](https://leak-otari.vercel.app/app?sample=1): press **Find my leaks**, then click any node in the glass box |
| Demo video | _link added on submission_ |
| Proof per feature | [EVIDENCE.md](EVIDENCE.md): each rubric item with the Otari request ID that shows it, and the app's **Proof** panel produces the same table for your own run |
| Feedback | [OTARI_FEEDBACK.md](OTARI_FEEDBACK.md) |
| Upstream | [mozilla-ai/otari#3039](https://github.com/mozilla-ai/otari/pull/3039), merged: a code execution call with no code is refused instead of reported as completed |
| First Otari commit | [`6a22d79`](https://github.com/0xvikram/leak/commit/6a22d79) on `devs-wilding` |

**Why it matters.** Apps that find forgotten subscriptions usually want your bank login and keep your data. Leak needs neither: no account, no bank connection, no database. Identifiers are stripped before any request, an Otari guardrail is the second lock, and the page shows exactly what the model saw.

**Live demos in the app.** Tick *send it unstripped* to watch Otari's guardrail refuse the statement; tick *break the first model* to watch Otari fall back to another; pick **Jordan** to watch Otari refuse a run at a near-empty per-person budget.

## How a run works

1. **Strip identifiers.** Account, card and routing numbers, email and phone are replaced with tags in the browser's request before anything leaves the server ([`src/lib/redact.ts`](src/lib/redact.ts)).
2. **Extract.** Qwen 3.5 35B reads the statement and returns the recurring charges and bank fees as JSON.
3. **Research.** DeepSeek V4 Flash uses Otari's web search and fetch to find each service's price today and its official cancel page, four services per request, in parallel.
4. **Add it up.** The app's own Python runs in Otari's code sandbox, so the headline numbers are arithmetic, not a model's guess.
5. **Show the work.** A live "glass box" map lights up each Otari feature as it runs; click a node to see every request as the gateway reported it: model, provider, fallback, guardrail verdict, member budget, cost, searches and the Python it ran. "What the AI saw" shows the statement exactly as it was sent, identifiers stamped out.
6. **Plug the leaks.** Each subscription is a card with a keep/plug switch; overlapping services start plugged and the yearly savings counter rolls as you flip them. For anything you plug, Ministral 8B writes the cancellation message, or a fee-refund request to the bank.

## Otari features, and where they run

| Feature | How Leak uses it | Code |
| --- | --- | --- |
| Open-weight models, three roles | Qwen 3.5 35B extracts; DeepSeek V4 Flash researches; Ministral 8B writes cancellations | [`src/lib/otari.ts`](src/lib/otari.ts) `MODELS`, [`src/app/api/draft/route.ts`](src/app/api/draft/route.ts) |
| Web search and fetch | Today's prices and cancel pages | [`src/lib/pipeline.ts`](src/lib/pipeline.ts) `researchBatch` |
| Code execution | Totals, overlaps and price rises computed in Otari's sandbox | `runCode` in `otari.ts`, `totalsProgram` in `pipeline.ts` |
| Guardrails | A PII guardrail mandated on the workspace blocks any statement that still carries an account number. The "skip stripping" switch on the page shows it | `otariError` in `otari.ts`, banner in [`src/app/page.tsx`](src/app/page.tsx) |
| Per-user budgets | Each household member (Alex, Sam, Jordan) is an end user of a service key, with a daily budget of their own, shown as an allowance meter | `member()` in `pipeline.ts`, [`src/app/api/members/route.ts`](src/app/api/members/route.ts) |
| Budgets and spending limits | A spend ceiling on the app's key; a per-visitor run limit on the public demo | Otari dashboard, [`src/app/api/analyze/route.ts`](src/app/api/analyze/route.ts) |
| Routing and fallbacks | The extract step calls the `leak-extract` failover policy (Qwen, then GPT-OSS 20B) | `OTARI_EXTRACT_MODEL` in `otari.ts` |

Every response header Otari sends (`Otari-Model`, `Otari-Provider`, `Otari-Fallback`, `Otari-Guardrails`, `Otari-End-User-Budget`, `Otari-Request-ID`) is read in `chat()` and shown in the panel.

## Run it

```bash
npm install
cp .env.example .env.local   # then add your Otari key
npm run dev
```

| Variable | Required | What |
| --- | --- | --- |
| `OTARI_API_KEY` | yes | A key from otari.ai |
| `OTARI_SERVICE_KEY` | no | A service key with an end-user budget, for per-member budgets |
| `OTARI_EXTRACT_MODEL` | no | A routing policy name for the extract step, e.g. `leak-extract` |
| `OTARI_RESEARCH_MODEL` | no | Defaults to `deepseek/deepseek-v4-flash` |
| `OTARI_DRAFT_MODEL` | no | Defaults to `mistralai/ministral-3-8b` |
| `LEAK_RUNS_PER_HOUR` | no | Runs per visitor per hour on a public deploy (default 6) |

## Notes from building on hosted Otari

- Requests that do not stream are cut off at 30 seconds, so research runs in parallel batches and the totals run as plain Python rather than a model loop.
- With streaming on, DeepSeek's code-execution calls reached the sandbox with empty code and were reported as `completed`. The reporting half is fixed upstream in [mozilla-ai/otari#3039](https://github.com/mozilla-ai/otari/pull/3039).

## Contributions to Otari

- [#3039](https://github.com/mozilla-ai/otari/pull/3039), merged: a code execution call with no code is refused instead of reported as completed.

## License

MIT

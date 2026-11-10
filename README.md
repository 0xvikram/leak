# Leak

Drop in a bank statement and see every subscription and hidden fee, what it costs you a year, and how to cancel it. Account numbers are removed before any model sees them.

Built for [MozFest Developers Wilding](https://otari.ai/devs-wilding). Every model call goes through hosted [Otari](https://otari.ai), Mozilla.ai's open-source AI gateway, and every model is open-weight.

**Live:** https://leak-otari.vercel.app (use the sample statement; it is fictional)

On the sample, Leak finds 12 subscriptions costing $2,938 a year, $516 a year spent on overlapping video and music services, and $297 a year in bank fees. A full run costs about one cent of Otari credit.

## How a run works

1. **Strip identifiers.** Account, card and routing numbers, email and phone are replaced with tags in the browser's request before anything leaves the server ([`src/lib/redact.ts`](src/lib/redact.ts)).
2. **Extract.** Qwen 3.5 35B reads the statement and returns the recurring charges and bank fees as JSON.
3. **Research.** DeepSeek V4 Flash uses Otari's web search and fetch to find each service's price today and its official cancel page, four services per request, in parallel.
4. **Add it up.** The app's own Python runs in Otari's code sandbox, so the headline numbers are arithmetic, not a model's guess.
5. **Show the work.** The page streams each step, and a "What Otari did" panel lists every request as the gateway reported it: model, provider, fallback, guardrail verdict, member budget, cost, searches and the Python it ran.

## Otari features, and where they run

| Feature | How Leak uses it | Code |
| --- | --- | --- |
| Open-weight models, two roles | Qwen 3.5 35B extracts; DeepSeek V4 Flash researches | [`src/lib/otari.ts`](src/lib/otari.ts) `MODELS` |
| Web search and fetch | Today's prices and cancel pages | [`src/lib/pipeline.ts`](src/lib/pipeline.ts) `researchBatch` |
| Code execution | Totals, overlaps and price rises computed in Otari's sandbox | `runCode` in `otari.ts`, `totalsProgram` in `pipeline.ts` |
| Guardrails | A PII guardrail mandated on the workspace blocks any statement that still carries an account number. The "skip stripping" switch on the page shows it | `otariError` in `otari.ts`, banner in [`src/app/page.tsx`](src/app/page.tsx) |
| Per-user budgets | Each household member (Alex, Sam, Jordan) is an end user of a service key, with a daily budget of their own | `member()` in `pipeline.ts` |
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
| `LEAK_RUNS_PER_HOUR` | no | Runs per visitor per hour on a public deploy (default 6) |

## Notes from building on hosted Otari

- Requests that do not stream are cut off at 30 seconds, so research runs in parallel batches and the totals run as plain Python rather than a model loop.
- With streaming on, DeepSeek's code-execution calls reached the sandbox with empty code and were reported as `completed`. The reporting half is fixed upstream in [mozilla-ai/otari#3039](https://github.com/mozilla-ai/otari/pull/3039).

## Contributions to Otari

- [#3039](https://github.com/mozilla-ai/otari/pull/3039), merged: a code execution call with no code is refused instead of reported as completed.

## License

MIT

# Building Leak on Otari: feedback

Notes from building Leak on hosted otari.ai between 9 and 11 November 2026, in the order the Devs Wilding feedback questions ask them.

## What worked well

- **One key, many open-weight models.** Qwen 3.5 35B, DeepSeek V4 Flash and Ministral 8B from three labs, through one OpenAI-compatible endpoint. Swapping a model is one string.
- **The response headers.** `Otari-Model`, `Otari-Provider`, `Otari-Fallback`, `Otari-Request-ID` and `usage.cost_usd` are what make Leak's "glass box" possible: the page shows users exactly which model answered and what it cost, without any bookkeeping of our own.
- **Code execution.** The direct `/api/v1/code/execute` endpoint answers in about a second, so the headline totals are computed in a sandbox instead of trusted from a model.
- **Service keys and end users.** Naming a household member in the `user` field and reading their spend back from `/api/v1/end-users` took a few lines.

## What didn't work

| What happened | Effect on Leak | Workaround |
| --- | --- | --- |
| A request that sends nothing back for about 30 seconds gets a 504 from the hosted edge (CloudFront), even when the gateway is still working | Extraction and web research failed intermittently | Every call is streamed |
| Streamed DeepSeek V4 Flash `otari_code_execution` calls reached the sandbox with empty code and were reported as `completed` | The model looped until the client gave up | Fixed the reporting half upstream in [mozilla-ai/otari#3039](https://github.com/mozilla-ai/otari/pull/3039); Leak runs its arithmetic through the direct endpoint |
| With `max_uses` on `otari_web_search`, the model kept calling after the cap; Otari refused each call (`call_limit`) and the loop ended in a 422 | Web research failed on the live site | No hard cap; research in batches of three with a one-search instruction |
| `max_uses` on `otari_web_fetch` returned a 400 | Research failed | Removed it (open issue #3013) |
| Web tools returned 403 or 400 with an empty body while web access was off for the workspace | Hard to tell why research failed | Mapped the status to a message in the app |
| A routing policy created in the dashboard was not visible to a key, with `invalid_model` | Fallback could not be wired at first | The policy has to live in the key's workspace; the error could say so (issue #2986) |

## What's missing, and what I'd change

- A stable `Otari-Error-Code` on every refusal, including workspace-setting refusals, so a client can explain them without guessing.
- When a model sends tool arguments that are not valid JSON, return a tool error ("arguments were not valid JSON") rather than running the tool with `{}`.
- After a tool's `max_uses` is reached, stop offering the tool to the model, or end the loop with an answer, instead of refusing call after call.

## When was I most tempted to skip Otari?

When the 30-second cut-off kept killing the web research step. Calling DeepSeek directly would have avoided the edge timeout, but I would have lost web search, the cost header and the fallback, so I moved everything to streaming instead.

## What did I build myself that Otari should do?

- Batching and parallelising long web research so each request stays short.
- Collecting `otari_tool_calls` from streamed chunks and keeping the latest state of each call by id.
- Stripping account numbers before the request. The guardrail blocks; a redaction mode that masks instead of refusing would let apps send cleaned text through the gateway.

## Would I keep using Otari without the rules requiring it?

Yes. For a money app the selling point is being able to show users exactly which model saw their data, where it ran and what it cost. Otari hands that over on every response; doing it ourselves across three providers would be most of the work.

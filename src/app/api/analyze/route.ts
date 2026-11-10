import { otariError } from "@/lib/otari";
import { analyze, type StepEvent } from "@/lib/pipeline";

export const runtime = "nodejs";
export const maxDuration = 300;

const MEMBERS = new Set(["alex", "sam", "jordan"]);
const MAX_STATEMENT_CHARS = 40_000;

// A public demo spends real Otari credit, so each visitor gets a few runs an hour.
// Per server instance only; the key's spend ceiling in Otari is the hard stop.
const RUNS_PER_HOUR = Number(process.env.LEAK_RUNS_PER_HOUR ?? 6);
const runs = new Map<string, number[]>();

function allowed(ip: string): boolean {
  const now = Date.now();
  const recent = (runs.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= RUNS_PER_HOUR) return false;
  recent.push(now);
  runs.set(ip, recent);
  return true;
}

/** Streams each step as one JSON line, so the page can show Otari working as it happens. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    statement?: string;
    member?: string;
    skipRedaction?: boolean;
  } | null;
  const statement = body?.statement?.trim();
  if (!statement) return Response.json({ error: "Paste a statement first" }, { status: 400 });
  if (statement.length > MAX_STATEMENT_CHARS) {
    return Response.json({ error: "That statement is too long for the demo (40,000 characters max)" }, { status: 413 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allowed(ip)) {
    return Response.json({ error: "That's the demo limit for this hour. Try again later." }, { status: 429 });
  }
  const member = MEMBERS.has(body?.member ?? "") ? body!.member! : "alex";

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e: StepEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(e)}\n`));
      try {
        await analyze(statement, { member, skipRedaction: Boolean(body?.skipRedaction) }, emit);
      } catch (err) {
        const e = otariError(err);
        emit({ type: "error", step: "run", code: e.code, message: e.message });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" } });
}

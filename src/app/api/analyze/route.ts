import { otariError } from "@/lib/otari";
import { allowed } from "@/lib/limit";
import { analyze, type StepEvent } from "@/lib/pipeline";

export const runtime = "nodejs";
export const maxDuration = 300;

const MEMBERS = new Set(["alex", "sam", "jordan"]);
const MAX_STATEMENT_CHARS = 40_000;

const RUNS_PER_HOUR = Number(process.env.LEAK_RUNS_PER_HOUR ?? 4);

/** Streams each step as one JSON line, so the page can show Otari working as it happens. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    statement?: string;
    member?: string;
    skipRedaction?: boolean;
    drill?: boolean;
  } | null;
  const statement = body?.statement?.trim();
  if (!statement) return Response.json({ error: "Paste a statement first" }, { status: 400 });
  if (statement.length > MAX_STATEMENT_CHARS) {
    return Response.json({ error: "That statement is too long for the demo (40,000 characters max)" }, { status: 413 });
  }
  if (!allowed(req, "analyze", RUNS_PER_HOUR)) {
    return Response.json({ error: "That's the demo limit for this hour. Try again later." }, { status: 429 });
  }
  const member = MEMBERS.has(body?.member ?? "") ? body!.member! : "alex";

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e: StepEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(e)}\n`));
      try {
        await analyze(statement, { member, skipRedaction: Boolean(body?.skipRedaction), drill: Boolean(body?.drill) }, emit);
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

import { allowed } from "@/lib/limit";
import { chat, MODELS, otariError, usesServiceKey } from "@/lib/otari";

export const runtime = "nodejs";
export const maxDuration = 60;

const MEMBERS = new Set(["alex", "sam", "jordan"]);

/** Writes the cancellation email (or fee-refund request) for one charge the person chose to plug. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    service?: string;
    amount?: number;
    kind?: "cancel" | "fee";
    cancelUrl?: string | null;
    member?: string;
  } | null;
  const service = body?.service?.slice(0, 80).trim();
  if (!service) return Response.json({ error: "Which charge?" }, { status: 400 });
  if (!allowed(req, "draft", 30)) return Response.json({ error: "That's the draft limit for this hour." }, { status: 429 });
  const member = MEMBERS.has(body?.member ?? "") ? body!.member! : "alex";
  const fee = body?.kind === "fee";

  try {
    const { text, trace } = await chat("draft", {
      model: MODELS.draft,
      max_tokens: 400,
      temperature: 0.3,
      ...(usesServiceKey() ? { user: `household:${member}` } : {}),
      messages: [
        {
          role: "system",
          content: fee
            ? "Write a short, polite email to a bank asking it to refund a fee and waive it in future. Plain text, a subject line first, " +
              "under 110 words. Start the body with 'Hello,'. The only placeholder allowed is [Your name]: no dates, team names, years or other brackets. " +
              "Amounts are US dollars, written with $. The customer has been loyal and the fee was unexpected. No markdown."
            : "Write a short cancellation message a customer can paste into a support form or email. Plain text, a subject line first, " +
              "under 100 words, no placeholders except [Your name] and [Account email]. Ask for written confirmation and no further charges. " +
              "Only if cancelPage is a URL, end with one line saying the fastest route is that page, with the URL; otherwise never mention a page or URL. " +
              "No markdown, no bold, no brackets other than those two placeholders.",
        },
        {
          role: "user",
          content: JSON.stringify({
            service,
            amount: typeof body?.amount === "number" ? `$${body.amount.toFixed(2)}` : null,
            cancelPage: body?.cancelUrl ?? null,
          }),
        },
      ],
    });
    return Response.json({ text: text.replace(/\*\*/g, "").trim(), trace });
  } catch (err) {
    const e = otariError(err);
    return Response.json({ error: e.message, code: e.code }, { status: e.status });
  }
}

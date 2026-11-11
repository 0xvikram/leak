import { MODELS } from "@/lib/otari";

export const dynamic = "force-dynamic";

/** Which live demos this deployment can run, so the page only offers what will really work. */
export function GET() {
  const serviceKey = Boolean(process.env.OTARI_SERVICE_KEY);
  return Response.json({
    drill: Boolean(MODELS.drill),
    tiny: serviceKey && Boolean(process.env.OTARI_TINY_BUDGET_ID),
    members: serviceKey,
    extractModel: MODELS.extract,
  });
}

import { OTARI_BASE_URL } from "@/lib/otari";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MEMBERS = ["alex", "sam", "jordan"];

type Budget = { id: string; name?: string; max_budget?: number | null; budget_duration?: string | null };
type EndUser = { external_id: string; spend: number; budget_id: string | null; blocked: boolean };

/** Each household member's spend against their own Otari end-user budget. Needs the service key. */
export async function GET() {
  const key = process.env.OTARI_SERVICE_KEY;
  if (!key) return Response.json({ configured: false, members: [] });
  const headers = { "Otari-Key": key };
  try {
    const budgetsRes = await fetch(`${OTARI_BASE_URL}/end-user-budgets`, { headers, cache: "no-store" });
    const budgets = budgetsRes.ok ? ((await budgetsRes.json()) as Budget[] | { data?: Budget[] }) : [];
    const list = Array.isArray(budgets) ? budgets : (budgets.data ?? []);
    const members = await Promise.all(
      MEMBERS.map(async (id) => {
        const res = await fetch(`${OTARI_BASE_URL}/end-users?external_id=${encodeURIComponent(`household:${id}`)}`, {
          headers,
          cache: "no-store",
        });
        const [user] = res.ok ? ((await res.json()) as EndUser[]) : [];
        const budget = list.find((b) => b.id === user?.budget_id) ?? list[0];
        return {
          id,
          spend: user?.spend ?? 0,
          limit: budget?.max_budget ?? null,
          period: budget?.budget_duration ?? null,
          blocked: user?.blocked ?? false,
        };
      }),
    );
    return Response.json({ configured: true, members });
  } catch {
    return Response.json({ configured: true, members: [], error: "Could not read member budgets" });
  }
}

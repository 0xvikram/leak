"use client";

export type Member = { id: string; spend: number; limit: number | null; period: string | null; blocked: boolean };

export const MEMBERS = [
  { id: "alex", label: "Alex" },
  { id: "sam", label: "Sam" },
  { id: "jordan", label: "Jordan", note: "teen" },
];

/** Who is running Leak, and how much of their own Otari budget they have used. */
export function Household({
  member,
  onPick,
  members,
  configured,
}: {
  member: string;
  onPick: (id: string) => void;
  members: Member[];
  configured: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Household member">
      {MEMBERS.map((m) => {
        const data = members.find((x) => x.id === m.id);
        const pct = data?.limit ? Math.min(100, (data.spend / data.limit) * 100) : 0;
        const active = member === m.id;
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onPick(m.id)}
            className={`rounded-xl border px-3 py-2 text-left transition-colors ${
              active ? "border-accent bg-accent-soft" : "border-line bg-raised hover:border-muted"
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium">
                {m.label}
                {m.note && <span className="ml-1 text-[10px] font-normal text-muted">{m.note}</span>}
              </span>
              {data?.blocked && <span className="text-[10px] text-danger">blocked</span>}
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
              <div
                className={`h-full rounded-full transition-all duration-700 ${pct > 85 ? "bg-danger" : "bg-accent"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="num mt-1 text-[10px] text-muted">
              {!configured
                ? "budget not set up"
                : data?.limit
                  ? `$${data.spend.toFixed(3)} of $${data.limit.toFixed(2)}${data.period ? ` / ${data.period}` : ""}`
                  : `$${(data?.spend ?? 0).toFixed(3)} used`}
            </div>
          </button>
        );
      })}
    </div>
  );
}

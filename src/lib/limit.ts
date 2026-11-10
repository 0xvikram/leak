// A public demo spends real Otari credit, so each visitor gets a few calls an hour.
// Per server instance only; the key's spend ceiling in Otari is the hard stop.
const buckets = new Map<string, number[]>();

export function allowed(req: Request, bucket: string, perHour: number): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= perHour) return false;
  recent.push(now);
  buckets.set(key, recent);
  return true;
}

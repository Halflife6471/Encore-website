import { headers } from "next/headers";

/**
 * Sliding-window limiter held in memory (per server instance).
 * Good enough as a first line of defence; production should back this with a
 * shared store (e.g. Redis/KV) so limits hold across instances (SRD NFR-06).
 */
type Bucket = number[];
const buckets = new Map<string, Bucket>();

export function hit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    buckets.set(key, arr);
    return { ok: false, retryAfterMs: windowMs - (now - arr[0]) };
  }
  arr.push(now);
  buckets.set(key, arr);
  if (buckets.size > 5000) for (const [k, v] of buckets) if (!v.length || now - v[v.length - 1] > windowMs) buckets.delete(k);
  return { ok: true, retryAfterMs: 0 };
}

export function peek(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  return arr.length < limit;
}

export function reset(key: string) {
  buckets.delete(key);
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

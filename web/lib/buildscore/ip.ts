// Portable client-IP extraction. @vercel/functions's ipAddress() only reads
// Vercel's proprietary x-real-ip header -- fine on Vercel, silently wrong
// behind a generic reverse proxy (e.g. Coolify/Traefik on a self-hosted
// VPS), where it would collapse per-IP rate limiting into one shared bucket.
// This checks the standard headers any reverse proxy is expected to set.

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Left-most entry is the original client; proxies append their own IP.
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}

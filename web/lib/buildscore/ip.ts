// Portable client-IP extraction. @vercel/functions's ipAddress() only reads
// Vercel's proprietary x-real-ip header -- fine on Vercel, silently wrong
// behind a generic reverse proxy (e.g. Coolify/Traefik on a self-hosted
// VPS), where it would collapse per-IP rate limiting into one shared bucket.
// This checks the standard headers any reverse proxy is expected to set.
//
// Deployment topology (see DEPLOY.md) is exactly one trusted hop: client ->
// Traefik -> this app. Reverse proxies APPEND the connecting IP to any
// x-forwarded-for the client already sent rather than replacing it, so the
// left-most entry is attacker-controlled (send a random fake IP on every
// request and each one lands in a fresh rate-limit bucket, bypassing the
// limit entirely). Only the right-most entry -- the one Traefik itself
// appended -- is trustworthy.

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor.split(",").map((p) => p.trim()).filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}

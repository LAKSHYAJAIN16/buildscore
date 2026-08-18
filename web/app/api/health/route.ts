import { NextResponse } from "next/server";

// Liveness check for the reverse proxy / Coolify's health check config.
// Deliberately does not touch the database -- a DB outage shouldn't make
// the proxy think the app container itself is down.
export async function GET() {
  return NextResponse.json({ ok: true });
}

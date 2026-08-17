import { after } from "next/server";
import { NextRequest, NextResponse } from "next/server";

import { checkAndIncrementRateLimit } from "@/lib/buildscore/db/rate-limit";
import { claimScanSlot } from "@/lib/buildscore/db/user-scores";
import { getClientIp } from "@/lib/buildscore/ip";
import { runScanChunk } from "@/lib/buildscore/pipeline";
import { isValidGithubUsername } from "@/lib/buildscore/username";
import { RATE_LIMIT_SCAN_MAX_REQUESTS, RATE_LIMIT_SCAN_WINDOW_SECONDS } from "@/lib/buildscore/variables";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as { username?: unknown } | null;
    const raw = body?.username;

    if (!isValidGithubUsername(raw)) {
      return NextResponse.json({ error: "Invalid GitHub username." }, { status: 400 });
    }
    const username = raw.toLowerCase();

    const ip = getClientIp(request);
    const rateLimit = await checkAndIncrementRateLimit(
      `${ip}:scan`,
      RATE_LIMIT_SCAN_WINDOW_SECONDS,
      RATE_LIMIT_SCAN_MAX_REQUESTS
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many scans, slow down." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const claim = await claimScanSlot(username);

    if (claim.kind === "fresh_cached") {
      return NextResponse.json(
        { username, status: "completed", ...(claim.row.result as Record<string, unknown>) },
        { status: 200 }
      );
    }
    if (claim.kind === "already_running") {
      return NextResponse.json({ username, status: claim.status }, { status: 202 });
    }

    // claim.kind === "claimed" -- we own this scan now.
    after(() => runScanChunk(username));
    return NextResponse.json({ username, status: "pending" }, { status: 202 });
  } catch (err) {
    console.error("[buildscore] POST /api/scan failed:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

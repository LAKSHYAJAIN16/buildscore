import { ipAddress } from "@vercel/functions";
import { NextRequest, NextResponse } from "next/server";

import { checkAndIncrementRateLimit } from "@/lib/buildscore/db/rate-limit";
import { getUserScore } from "@/lib/buildscore/db/user-scores";
import { isValidGithubUsername } from "@/lib/buildscore/username";
import { RATE_LIMIT_POLL_MAX_REQUESTS, RATE_LIMIT_POLL_WINDOW_SECONDS } from "@/lib/buildscore/variables";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username: raw } = await context.params;
    if (!isValidGithubUsername(raw)) {
      return NextResponse.json({ error: "Invalid GitHub username." }, { status: 400 });
    }
    const username = raw.toLowerCase();

    const ip = ipAddress(request) ?? "unknown";
    const rateLimit = await checkAndIncrementRateLimit(
      `${ip}:poll`,
      RATE_LIMIT_POLL_WINDOW_SECONDS,
      RATE_LIMIT_POLL_MAX_REQUESTS
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests, slow down." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const row = await getUserScore(username);
    if (!row) {
      return NextResponse.json(
        { error: "No scan found for this username. POST /api/scan first." },
        { status: 404 }
      );
    }

    if (row.status === "completed") {
      return NextResponse.json(
        { username: row.username, status: "completed", ...(row.result as Record<string, unknown>) },
        { status: 200 }
      );
    }
    if (row.status === "failed") {
      return NextResponse.json(
        { username: row.username, status: "failed", error: row.error },
        { status: 200 }
      );
    }
    return NextResponse.json(
      { username: row.username, status: row.status, progress: row.progress },
      { status: 200 }
    );
  } catch (err) {
    console.error("[buildscore] GET /api/scan/[username] failed:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

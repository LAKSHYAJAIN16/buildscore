import { after } from "next/server";
import { NextRequest, NextResponse } from "next/server";

import { runScanChunk } from "@/lib/buildscore/pipeline";
import { isValidGithubUsername } from "@/lib/buildscore/username";

export const runtime = "nodejs";
// Keep in sync with SCAN_CHUNK_TIME_BUDGET_MS in lib/buildscore/variables.ts
// -- Next's route-segment config must be a static literal, so this can't be
// imported; leave headroom above the chunk budget for the surrounding work.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    if (request.headers.get("x-internal-secret") !== process.env.INTERNAL_WORKER_SECRET) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json().catch(() => null)) as { username?: unknown } | null;
    const raw = body?.username;
    if (!isValidGithubUsername(raw)) {
      return NextResponse.json({ error: "Invalid GitHub username." }, { status: 400 });
    }

    after(() => runScanChunk(raw));
    return NextResponse.json({ ok: true }, { status: 202 });
  } catch (err) {
    console.error("[buildscore] POST /api/scan/worker failed:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

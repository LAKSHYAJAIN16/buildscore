import { NextRequest, NextResponse } from "next/server";

import { checkAndIncrementRateLimit } from "@/lib/buildscore/db/rate-limit";
import { getClientIp } from "@/lib/buildscore/ip";
import { isValidGithubUsername } from "@/lib/buildscore/username";
import { RATE_LIMIT_GRANTS_MAX_REQUESTS, RATE_LIMIT_GRANTS_WINDOW_SECONDS } from "@/lib/buildscore/variables";
import { checkEligibility, insertGrantApplication } from "@/lib/grants/db";
import {
  APPLICATIONS_OPEN,
  MAX_EMAIL_LENGTH,
  MAX_PITCH_LENGTH,
  MAX_PROJECT_NAME_LENGTH,
  MIN_BUILDSCORE_THRESHOLD,
} from "@/lib/grants/data";

export const runtime = "nodejs";

// Deliberately permissive -- this only guards against obviously-malformed
// input, not full RFC 5322 validation (that's a rabbit hole with no payoff
// here; a bounced email just means we can't reach that applicant).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ApplyBody {
  username?: unknown;
  projectName?: unknown;
  pitch?: unknown;
  email?: unknown;
  // Honeypot: a real visitor never sees or fills this field (hidden via CSS
  // on the form). A bot filling every field in a scraped form typically
  // fills this too -- if it's non-empty, silently drop the submission
  // without telling the caller anything was wrong, so scrapers don't learn
  // to skip the field.
  company?: unknown;
}

function isNonEmptyString(v: unknown, maxLength: number): v is string {
  return typeof v === "string" && v.trim().length > 0 && v.length <= maxLength;
}

export async function POST(request: NextRequest) {
  try {
    if (!APPLICATIONS_OPEN) {
      return NextResponse.json({ error: "Applications aren't open right now." }, { status: 403 });
    }

    const body = (await request.json().catch(() => null)) as ApplyBody | null;
    if (!body) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    if (typeof body.company === "string" && body.company.trim().length > 0) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const usernameRaw = body.username;
    if (!isValidGithubUsername(usernameRaw)) {
      return NextResponse.json({ error: "Invalid GitHub username." }, { status: 400 });
    }
    const username = usernameRaw.toLowerCase();

    if (!isNonEmptyString(body.projectName, MAX_PROJECT_NAME_LENGTH)) {
      return NextResponse.json({ error: "Project name is required." }, { status: 400 });
    }
    if (!isNonEmptyString(body.pitch, MAX_PITCH_LENGTH)) {
      return NextResponse.json({ error: "Tell us a bit more about the project." }, { status: 400 });
    }
    if (!isNonEmptyString(body.email, MAX_EMAIL_LENGTH) || !EMAIL_PATTERN.test(body.email.trim())) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }

    const ip = getClientIp(request);
    const rateLimit = await checkAndIncrementRateLimit(
      `${ip}:grants`,
      RATE_LIMIT_GRANTS_WINDOW_SECONDS,
      RATE_LIMIT_GRANTS_MAX_REQUESTS
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many applications, slow down." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const eligibility = await checkEligibility(username);
    if (!eligibility.eligible) {
      if (eligibility.reason === "no_score") {
        return NextResponse.json(
          { error: "We couldn't find a Buildscore for this username. Get scored first, then apply." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        {
          error: `This username's Buildscore (${eligibility.score}) is below the ${MIN_BUILDSCORE_THRESHOLD} required to apply.`,
        },
        { status: 400 }
      );
    }

    await insertGrantApplication({
      username,
      projectName: body.projectName.trim(),
      pitch: body.pitch.trim(),
      email: body.email.trim(),
      buildscoreAtApply: Math.round(eligibility.score),
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[buildscore] POST /api/grants/apply failed:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

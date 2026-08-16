from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from .github_client import GitHubClient
from .variables import DRIFT_TOLERANCE

STATE_FILE = Path.home() / ".buildscore" / "rate_limit_state.json"


@dataclass
class UsageWarning:
    message: str


def _token_fingerprint(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()[:16]


def _load_state() -> dict:
    if not STATE_FILE.exists():
        return {}
    try:
        return json.loads(STATE_FILE.read_text())
    except (json.JSONDecodeError, OSError):
        return {}


def _save_state(all_state: dict, client: GitHubClient) -> None:
    fingerprint = _token_fingerprint(client.token)
    all_state[fingerprint] = {
        "remaining": client.rate_limit_remaining,
        "reset": client.rate_limit_reset.isoformat(),
        "recorded_at": datetime.now(timezone.utc).isoformat(),
    }
    STATE_FILE.parent.mkdir(exist_ok=True)
    STATE_FILE.write_text(json.dumps(all_state, indent=2))


def check_for_suspicious_drift(client: GitHubClient) -> UsageWarning | None:
    """Compares expected vs. actual rate-limit quota to catch a token being
    used concurrently by something other than this run (e.g. it leaked)."""
    if client.rate_limit_remaining is None or client.rate_limit_reset is None:
        return None

    all_state = _load_state()
    fingerprint = _token_fingerprint(client.token)
    previous = all_state.get(fingerprint)

    warning = None
    if previous is not None:
        prev_reset = datetime.fromisoformat(previous["reset"])
        if prev_reset == client.rate_limit_reset:
            expected_remaining = previous["remaining"] - client.calls_made
            drift = expected_remaining - client.rate_limit_remaining
            if drift > DRIFT_TOLERANCE:
                warning = UsageWarning(
                    f"{drift} more GitHub API calls were made against this token "
                    "than this run accounts for. Something else may be using it "
                    "concurrently — consider revoking it at "
                    "https://github.com/settings/tokens if this is unexpected."
                )

    _save_state(all_state, client)
    return warning

"""Profanity detection on the free-text note field — spec §10.

Uses alt-profanity-check (ML classifier, not a wordlist).  Reports flagged
as likely-profane are NOT auto-rejected — they are stored with
``is_flagged = True`` for later review.  Admin panel is deferred to v1.x.

If alt-profanity-check is not installed (e.g. dependency conflict),
the filter degrades gracefully to a no-op so the app still runs.
"""

import logging

logger = logging.getLogger(__name__)

try:
    from profanity_check import predict as _predict  # type: ignore[import-untyped]

    def check_profanity(text: str | None) -> bool:
        """Return True if *text* is flagged as likely profane."""
        if not text:
            return False
        result = _predict([text])
        return bool(result[0])

    logger.info("alt-profanity-check loaded successfully.")

except ImportError:
    logger.warning(
        "alt-profanity-check is not installed — profanity filtering disabled. "
        "Install with: pip install alt-profanity-check"
    )

    def check_profanity(text: str | None) -> bool:  # type: ignore[misc]
        """No-op fallback — always returns False."""
        return False

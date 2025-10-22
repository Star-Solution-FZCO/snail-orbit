import re
from typing import NamedTuple

__all__ = (
    'MentionChange',
    'detect_mention_changes',
    'extract_mentions_from_text',
)


CODE_BLOCK_REGEX = re.compile(r'```.*?```', flags=re.DOTALL)
INLINE_CODE_REGEX = re.compile(r'`[^`]+`')
MENTION_REGEX = re.compile(
    r'\[@[^]]+]\(([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\)'
)


class MentionChange(NamedTuple):
    """Represents a change in mentions between old and new text."""

    newly_mentioned: set[str]
    removed_mentions: set[str]


def extract_mentions_from_text(text: str | None) -> set[str]:
    """Extract email mentions from the given text, ignoring code blocks."""
    if not text:
        return set()
    text = CODE_BLOCK_REGEX.sub('', text)
    text = INLINE_CODE_REGEX.sub('', text)
    return {match.group(1).strip().lower() for match in MENTION_REGEX.finditer(text)}


def detect_mention_changes(old_text: str | None, new_text: str | None) -> MentionChange:
    """Detect changes in mentions between old and new text.

    Args:
        old_text: Previous text content
        new_text: New text content

    Returns:
        MentionChange with newly mentioned and removed email addresses
    """
    old_mentions = extract_mentions_from_text(old_text)
    new_mentions = extract_mentions_from_text(new_text)

    newly_mentioned = new_mentions - old_mentions
    removed_mentions = old_mentions - new_mentions

    return MentionChange(
        newly_mentioned=newly_mentioned, removed_mentions=removed_mentions
    )

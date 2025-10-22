"""Tests for mention utilities."""

import pytest

from pm.utils.mentions import (
    MentionChange,
    detect_mention_changes,
    extract_mentions_from_text,
)

__all__ = ()


@pytest.mark.parametrize(
    ('text', 'expected'),
    [
        pytest.param(None, set(), id='none'),
        pytest.param('', set(), id='empty_string'),
        pytest.param('   ', set(), id='whitespace_only'),
        pytest.param(
            'Please review [@John Doe](john@example.com) this issue.',
            {'john@example.com'},
            id='single_mention',
        ),
        pytest.param(
            'Please review [@Alice](alice@test.com) and [@Bob Smith](bob@company.org).',
            {'alice@test.com', 'bob@company.org'},
            id='multiple_mentions',
        ),
        pytest.param(
            'Thanks [@Alice](alice@test.com) and [@Alice Again](alice@test.com)!',
            {'alice@test.com'},
            id='duplicate_mentions',
        ),
        pytest.param(
            'Contact [@John](John.Doe@EXAMPLE.COM) for details.',
            {'john.doe@example.com'},
            id='case_insensitive',
        ),
        pytest.param(
            """
            Complex emails:
            [@User](user.name+tag@sub.domain.com)
            [@Test](test_user@example-domain.co.uk)
            [@Numbers](user123@test456.org)
            """,
            {
                'user.name+tag@sub.domain.com',
                'test_user@example-domain.co.uk',
                'user123@test456.org',
            },
            id='complex_email_formats',
        ),
        pytest.param(
            """
            [@User & Admin](user@test.com)
            [@Jean-Pierre](jean@example.fr)
            [@Mary O'Connor](mary@example.ie)
            [@测试用户](test@example.cn)
            """,
            {'user@test.com', 'jean@example.fr', 'mary@example.ie', 'test@example.cn'},
            id='special_characters_in_names',
        ),
        pytest.param(
            """
            Valid mention: [@Alice](alice@test.com)

            ```
            Code block with [@Bob](bob@test.com) should be ignored
            ```

            Another valid: [@Charlie](charlie@test.com)
            """,
            {'alice@test.com', 'charlie@test.com'},
            id='triple_backtick_blocks',
        ),
        pytest.param(
            'Valid [@Alice](alice@test.com) but `[@Bob](bob@test.com)` is in code.',
            {'alice@test.com'},
            id='inline_backtick_code',
        ),
        pytest.param(
            """
            ```
            First code block with [@Ignored](ignored@test.com)
            ```

            Valid mention between blocks: [@Charlie](charlie@test.com)

            ```
            Second code block with [@AlsoIgnored](also@test.com)
            ```
            """,
            {'charlie@test.com'},
            id='mention_between_code_blocks',
        ),
        pytest.param(
            """
            Valid: [@Alice](alice@test.com)

            ```python
            # This [@Bob](bob@test.com) is in Python code
            send_email("[@User](user@example.com)")
            ```

            Final: [@David](david@test.com)
            """,
            {'alice@test.com', 'david@test.com'},
            id='language_tagged_code_blocks',
        ),
        pytest.param(
            """
            # Issue Description

            Please review [@Alice](alice@test.com) this issue.

            ## Code Example
            ```javascript
            // This [@Bob](bob@test.com) should be ignored
            function notify(email) {
                sendEmail('[@User](user@example.com)', email);
            }
            ```

            Also check with `[@Charlie](charlie@test.com)` inline code.

            Final mention: [@David](david@test.com)
            """,
            {'alice@test.com', 'david@test.com'},
            id='mixed_code_and_mentions',
        ),
        pytest.param(
            """
            Valid: [@Alice](alice@test.com)
            Missing closing bracket: [@Bob](bob@test.com
            Missing email: [@Charlie]()
            No email format: [@David](not-an-email)
            Missing opening bracket: @Alice](alice_ignored@test.com)
            Missing parentheses: [@Eve]
            Missing at symbol: [Frank](franke@xample.com)
            """,
            {'alice@test.com'},
            id='malformed_mentions',
        ),
        pytest.param(
            """
            Valid: [@Alice](alice@test.com)
            No TLD: [@Bob](bob@test)
            Missing domain: [@Charlie](charlie@)
            Just @: [@David](@test.com)
            """,
            {'alice@test.com'},
            id='invalid_email_domains',
        ),
        pytest.param(
            'Contact [@John Admin Smith](admin@example.com) for access.',
            {'admin@example.com'},
            id='simple_brackets_in_names',
        ),
    ],
)
def test_extract_mentions_from_text(text, expected):
    """Test mention extraction from text."""
    assert extract_mentions_from_text(text) == expected


@pytest.mark.parametrize(
    ('old_text', 'new_text', 'expected_new', 'expected_removed'),
    [
        pytest.param(
            'Hello [@Alice](alice@test.com) and [@Bob](bob@test.com)!',
            'Hello [@Alice](alice@test.com) and [@Bob](bob@test.com)!',
            set(),
            set(),
            id='no_changes',
        ),
        pytest.param(
            'Hello [@Alice](alice@test.com)!',
            'Hello [@Alice](alice@test.com) and [@Bob](bob@test.com)!',
            {'bob@test.com'},
            set(),
            id='added_mentions',
        ),
        pytest.param(
            'Hello [@Alice](alice@test.com) and [@Bob](bob@test.com)!',
            'Hello [@Alice](alice@test.com)!',
            set(),
            {'bob@test.com'},
            id='removed_mentions',
        ),
        pytest.param(
            'Assigned to [@Alice](alice@test.com)',
            'Assigned to [@Bob](bob@test.com)',
            {'bob@test.com'},
            {'alice@test.com'},
            id='replaced_mentions',
        ),
        pytest.param(
            'Team: [@Alice](alice@test.com), [@Bob](bob@test.com), [@Charlie](charlie@test.com)',
            'Team: [@Alice](alice@test.com), [@David](david@test.com), [@Eve](eve@test.com)',
            {'david@test.com', 'eve@test.com'},
            {'bob@test.com', 'charlie@test.com'},
            id='multiple_changes',
        ),
        pytest.param(
            None,
            'Please review [@Alice](alice@test.com)',
            {'alice@test.com'},
            set(),
            id='none_to_mentions',
        ),
        pytest.param(
            'Please review [@Alice](alice@test.com)',
            None,
            set(),
            {'alice@test.com'},
            id='mentions_to_none',
        ),
        pytest.param(
            '',
            'Please review [@Alice](alice@test.com)',
            {'alice@test.com'},
            set(),
            id='empty_to_mentions',
        ),
        pytest.param(
            'Please review [@Alice](alice@test.com)',
            '',
            set(),
            {'alice@test.com'},
            id='mentions_to_empty',
        ),
        pytest.param(
            """
            Valid: [@Alice](alice@test.com)
            ```
            Code: [@Bob](bob@test.com)
            ```
            """,
            """
            Valid: [@Charlie](charlie@test.com)
            ```
            Code: [@Bob](bob@test.com)
            Still code: [@David](david@test.com)
            ```
            """,
            {'charlie@test.com'},
            {'alice@test.com'},
            id='code_block_changes',
        ),
        pytest.param(
            'Contact [@John Doe](john@example.com)',
            'Contact [@J. Doe](john@example.com)',
            set(),
            set(),
            id='same_email_different_names',
        ),
        pytest.param(
            'Contact [@John](John.Doe@EXAMPLE.COM)',
            'Contact [@John](john.doe@example.com)',
            set(),
            set(),
            id='case_insensitive_changes',
        ),
    ],
)
def test_detect_mention_changes(old_text, new_text, expected_new, expected_removed):
    """Test mention change detection."""
    result = detect_mention_changes(old_text, new_text)

    assert isinstance(result, MentionChange)
    assert result.newly_mentioned == expected_new
    assert result.removed_mentions == expected_removed

---
title: Issue Query Language
---
The Issue Query Language is a powerful search syntax that allows you to find issues using field-based queries, logical operators, and special keywords. This document covers all available query features and syntax.

## Basic Syntax

### Field Queries
Use the format `field_name: value` to search for issues with specific field values:

```
subject: "bug report"
project: my-project
assignee: user@example.com
```

### Multiple Values
Use commas to search for multiple values in the same field (OR logic):

```
project: proj1, proj2
priority: High, Critical
```

## Reserved Fields

The system includes several built-in fields that can be queried:

- `subject` - Issue title/subject
- `text` - Full text search in issue description and comments
- `project` - Project slug/name
- `id` - Issue ID or alias
- `tag` - Issue tags
- `created_at` - Issue creation date
- `updated_at` - Last update date
- `created_by` - User who created the issue
- `updated_by` - User who last updated the issue

## Custom Fields

You can query any custom field defined in your project:

```
State: Open
Priority: High
Assignee: john@company.com
Version: 1.2.3
Sprint: Sprint-1
```

## Value Types

### Text Values
Simple text without spaces or special characters:
```
project: myproject
subject: bug
```

### Quoted Strings
Use quotes for values containing spaces or special characters:
```
subject: "Login error with special chars"
project: "My Project Name"
```

### Null Values
Search for empty/unset fields:
```
assignee: null
priority: null
```

### User Values
Use email addresses or the special `me` keyword:
```
created_by: user@company.com
assignee: me
updated_by: admin@example.com
```

### Dates and Times
Use ISO 8601 format for dates and datetimes:

**Dates (YYYY-MM-DD):**
```
created_at: 2024-01-15
updated_at: 2024-12-31
```

**Datetimes (YYYY-MM-DDTHH:MM:SS):**
```
created_at: 2024-01-15T09:30:00
updated_at: 2024-12-31T23:59:59
```

### Relative Dates
Use relative date expressions:

**Current time/date:**
```
created_at: now
updated_at: today
```

**Time periods:**
```
created_at: this week
updated_at: this month
created_at: this year
```

**Time offsets:**
```
created_at: now +1d
updated_at: today -2d
created_at: now +3.5h
```

### Durations
Use duration format with units (s, m, h, d, w):
```
time_spent: 2h30m
estimated: 1d
duration: 45m
```

### Numbers
Integer and decimal numbers:
```
story_points: 5
progress: 85.5
priority_score: 100
```

### Boolean Values
True/false for boolean custom fields:
```
is_feature: true
is_bug: false
archived: null
```

## Ranges

Use ` .. ` to specify ranges for numeric, date, duration, and datetime values:

### Numeric Ranges
```
story_points: 1 .. 5
progress: 0 .. 100
priority_score: 80 .. 95
```

### Date Ranges
```
created_at: 2024-01-01 .. 2024-12-31
updated_at: 2024-06-01 .. 2024-06-30
```

### Duration Ranges
```
time_spent: 1h .. 8h
estimated: 1d .. 1w
```

### Open-ended Ranges
Use `inf` for infinity and `-inf` for negative infinity:

```
story_points: 5 .. inf      # 5 or greater
created_at: 2024-01-01 .. inf    # From Jan 1st onwards
priority_score: -inf .. 50        # Up to 50
updated_at: -inf .. today         # Up to today
```

## Special Keywords

### Resolution Status
Use hashtag keywords to filter by resolution status:

```
#resolved      # Only resolved issues
#unresolved    # Only unresolved issues
```

## Logical Operators

Logical operators are case-insensitive, so you can use `AND`/`and` and `OR`/`or`.

### AND Operator
Combine conditions that must all be true:
```
project: myproject AND priority: High
State: Open and assignee: me
created_at: 2024-01-01..2024-12-31 AND #unresolved
```

### OR Operator
Combine conditions where at least one must be true:
```
priority: High OR priority: Critical
State: Open or State: In Progress
assignee: me OR created_by: me
```

### Grouping with Parentheses
Use parentheses to group logical expressions:
```
project: backend AND (priority: High OR priority: Critical)
(State: Open OR State: In Progress) AND assignee: me
State: Open AND (priority: High OR (created_at: 2024-01-01..inf AND assignee: me))
```

## Complex Query Examples

### Find high-priority unresolved issues assigned to you:
```
priority: High AND assignee: me AND #unresolved
```

### Find issues created this week in specific projects:
```
created_at: this week AND (project: frontend OR project: backend)
```

### Find issues updated recently but not by you:
```
updated_at: today -1d .. inf AND updated_by: me NOT
```

Note: The `NOT` operator syntax may vary - check current implementation.

### Find issues with story points in a range, excluding completed ones:
```
story_points: 3 .. 8 AND State: Open, In Progress, Review
```

### Find overdue issues (estimated vs actual time):
```
estimated: -inf .. 2d AND time_spent: 3d .. inf
```

## Text Search Integration

The query language integrates with full-text search. You can use plain text search or combine it with structured queries:

### Plain Text Search
```
database connection error         # Full-text search across issue content
login bug firefox                 # Searches for issues containing these terms
```

### Combined with Structured Queries
If a query part cannot be parsed as a structured query, it will fall back to text search:

```
project: backend important bug    # Searches project "backend" AND text contains "important bug"
State: Open database connection   # Searches State "Open" AND text contains "database connection"
```

## Sorting

Use the `sort by:` clause to specify result ordering. You can sort by both reserved fields and custom fields.
### Sort Options

Available sort directions:
- `asc` (ascending, default when direction not specified)
- `desc` (descending)

You can sort by multiple fields separated by commas. Fields are sorted in the order specified (primary sort, then secondary sort, etc.).
### Examples

```
project: myproject sort by: created_at desc
Priority: High sort by: updated_at asc, Priority desc
State: Open sort by: Assignee, updated_at desc
assignee: me sort by: Sprint, Priority desc
sort by: Priority
```
### Default Sort Behavior

When no `sort by:` clause is specified, results are automatically sorted by `updated_at desc` (most recently updated first):

```
Priority: High                          # Implicitly: Priority: High sort by: updated_at desc
State: Open AND assignee: me            # Implicitly: State: Open AND assignee: me sort by: updated_at desc
```

The default sort is omitted from query strings to keep them clean, but is always applied for consistent ordering.

## Error Handling

When a query cannot be parsed, the system will typically fall back to text search or return no results. Common issues to watch out for:

- **Invalid brackets:** Unmatched parentheses `(` `)` will cause the query to fail
- **Invalid field names:** Typos in field names will be treated as text search
- **Invalid date formats:** Use ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
- **Invalid ranges:** Ensure start value is less than end value (e.g., `1 .. 5` not `5 .. 1`)
- **Missing colons:** Remember to use `:` after field names (e.g., `priority: High`)

If your query isn't working as expected, try simplifying it and building complexity gradually.

## Tips and Best Practices

1. **Use quotes** for field values containing spaces or special characters
2. **Use parentheses** to make complex logical expressions clear
3. **Test incrementally** - start with simple queries and add complexity
4. **Use relative dates** like `this week` or `today -1d` for dynamic searches
5. **Combine text search** with structured queries for best results
6. **Use ranges** for numeric and date fields to find issues within specific bounds
7. **Remember field types** - boolean fields need `true`/`false`, user fields need email addresses

## Limitations

- Only one `$text` search operation per query (MongoDB limitation)
- Field names are case-insensitive but values may be case-sensitive depending on field type
- Date arithmetic in offsets only supports hours (`h`) and days (`d`), not minutes or weeks
- Custom field availability depends on project configuration

## Grammar Specification

For reference, here is the formal grammar used by the query parser:

### Expression Grammar
```
start: attribute_condition | hashtag_value

hashtag_value: HASHTAG_RESOLVED | HASHTAG_UNRESOLVED

HASHTAG_RESOLVED: "#resolved"i
HASHTAG_UNRESOLVED: "#unresolved"i

attribute_condition: FIELD_NAME _COLON attribute_values

attribute_values: attribute_value ("," attribute_value)*

attribute_value: NULL_VALUE
                | NUMBER_VALUE
                | DURATION_VALUE
                | DATE_VALUE
                | DATETIME_VALUE
                | relative_dt
                | user_value
                | STRING_VALUE
                | QUOTED_STRING
                | number_range
                | number_left_inf_range
                | number_right_inf_range
                | duration_range
                | duration_left_inf_range
                | duration_right_inf_range
                | date_range
                | date_left_inf_range
                | date_right_inf_range
                | datetime_range
                | datetime_left_inf_range
                | datetime_right_inf_range
                | relative_dt_range
                | relative_dt_left_inf_range
                | relative_dt_right_inf_range

number_range: NUMBER_VALUE _RANGE_DELIMITER NUMBER_VALUE
number_left_inf_range: INF_MINUS_VALUE _RANGE_DELIMITER NUMBER_VALUE
number_right_inf_range: NUMBER_VALUE _RANGE_DELIMITER INF_PLUS_VALUE
duration_range: DURATION_VALUE _RANGE_DELIMITER DURATION_VALUE
duration_left_inf_range: INF_MINUS_VALUE _RANGE_DELIMITER DURATION_VALUE
duration_right_inf_range: DURATION_VALUE _RANGE_DELIMITER INF_PLUS_VALUE
date_range: DATE_VALUE _RANGE_DELIMITER DATE_VALUE
date_left_inf_range: INF_MINUS_VALUE _RANGE_DELIMITER DATE_VALUE
date_right_inf_range: DATE_VALUE _RANGE_DELIMITER INF_PLUS_VALUE
datetime_range: DATETIME_VALUE _RANGE_DELIMITER DATETIME_VALUE
datetime_left_inf_range: INF_MINUS_VALUE _RANGE_DELIMITER DATETIME_VALUE
datetime_right_inf_range: DATETIME_VALUE _RANGE_DELIMITER INF_PLUS_VALUE

user_value: USER_ME | EMAIL
relative_dt: dt_period_with_offset | dt_period
dt_period_with_offset: (NOW_VALUE | TODAY_VALUE) (dt_offset)*
dt_period: DATETIME_PERIOD_PREFIX DATETIME_PERIOD_UNIT
dt_offset: SIGN DATETIME_OFFSET_VALUE
relative_dt_range: relative_dt _RANGE_DELIMITER relative_dt
relative_dt_left_inf_range: INF_MINUS_VALUE _RANGE_DELIMITER relative_dt
relative_dt_right_inf_range: relative_dt _RANGE_DELIMITER INF_PLUS_VALUE

_RANGE_DELIMITER: ".."
_COLON: ":"
USER_ME: "me"i
EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
DATE_VALUE: /[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])/
DATETIME_VALUE: /[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)/
NULL_VALUE: "null"i
INF_PLUS_VALUE: "inf"i
INF_MINUS_VALUE: "-inf"i
FIELD_NAME: /[a-zA-Z_0-9][a-zA-Z0-9_ -]*/
NUMBER_VALUE: /[0-9]+(\.[0-9]+)?(?!\.(?!\.)|d|[a-zA-Z]|-)/
DURATION_VALUE: /(?:[0-9]+[smhdw]\s*)+(?![a-zA-Z0-9])/
STRING_VALUE: /[^:()" *${},]+/
QUOTED_STRING: /"[^"]*"/
SIGN: ("+" | "-")
NOW_VALUE: "now"i
TODAY_VALUE: "today"i
DATETIME_PERIOD_PREFIX: "this"i
DATETIME_PERIOD_UNIT: "week"i | "month"i | "year"i
DATETIME_OFFSET_VALUE: /[0-9]+(\.[5])?(?:h|d)(?![a-zA-Z0-9])/
```

### Sort Grammar
```
start: sort_expression ("," sort_expression)*

sort_expression: FIELD_NAME [direction]

direction: "asc"i -> ascending
         | "desc"i -> descending

FIELD_NAME: /[a-zA-Z_0-9][a-zA-Z0-9_ -]*/
```

This grammar is implemented using the [Lark parsing toolkit](https://lark-parser.readthedocs.io/) and defines the complete syntax for both search expressions and sort clauses.
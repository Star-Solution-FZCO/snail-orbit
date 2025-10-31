---
title: Custom Fields System
---
Custom fields in Snail Orbit allow you to extend issues with domain-specific data. Each field type has specific validation rules, input formats, and behaviors. This document covers all available custom field types and how to use them.

## Field Configuration

### Bundle System

Custom fields in Snail Orbit use a **Bundle System** where fields are organized into groups. Understanding this system is crucial for proper field configuration and querying.

**How Bundles Work:**
- **Field**: A logical grouping of related bundles identified by a field name
- **Bundle**: An individual instance within the field, connected to one or more projects

**Example:**
You might have a "Priority" field that contains multiple bundles:
- Bundle 1: Label "Critical Issues" connected to Backend and API projects
- Bundle 2: Label "Standard Priority" connected to Frontend project
- Bundle 3: Label "Low Priority Tasks" connected to DevOps and Documentation projects

All three bundles share the same field properties (Name: "Priority", Type: "enum", Description: "Issue priority level") but each has its own Label, Options, Nullable setting, Default Value, and **project connections**.

**Project Connection:**
Each bundle can be connected to one or more projects, but each project can only be connected to one bundle within a field (no overlapping connections). When an issue is created in a project, it will use the specific bundle connected to that project for the field.

**Bundle Selection:**
- If a project has a bundle connected for the field → uses that bundle's configuration (Label, Options, Nullable, Default Value)
- If a project has no bundle connected for the field → the field will not be available for issues in that project
- Each project can only use one bundle per field, ensuring consistent field behavior within the project

**Query Behavior:**
When searching issues, you use the shared field **Name**, not the individual bundle Labels:
```
priority: High    # Uses the field name "Priority"
```

This query will find issues across all bundles in the "Priority" field, regardless of their individual labels.

### Field Properties

These properties are **shared across all bundles** within the same field:

- **Name** - Internal field name (used in queries)
- **Type** - Field type (enum, string, user, etc.)
- **Description** - Help text describing the field purpose
- **AI Description** - Additional context for AI processing

### Individual Bundle Properties

These properties are **unique to each bundle** within a field:

- **Label** - Display name shown in UI
- **Options** - predefined choices/values for field types that support them (enum, state, version, owned, sprint, user)
- **Nullable (can be empty)** - Whether the field can be left empty
- **Default Value** - Default value for new issues


## Available Field Types

**Basic Field Types:**
- [[#String Fields|String]] - Simple text fields
- [[#Integer Fields|Integer]] - Whole numbers
- [[#Float Fields|Float]] - Decimal numbers
- [[#Boolean Fields|Boolean]] - True/false values
- [[#Date Fields|Date]] - Date-only values
- [[#DateTime Fields|DateTime]] - Full timestamps
- [[#Duration Fields|Duration]] - Time duration values

**Choice-Based Field Types:**
- [[#Enum Fields|Enum]] - Single choice from predefined options
- [[#Enum Multi Fields|Enum Multi]] - Multiple choices from predefined options
- [[#State Fields|State]] - Special enum with resolution tracking
- [[#Version Fields|Version]] - Single version reference
- [[#Version Multi Fields|Version Multi]] - Multiple version references
- [[#Owned Fields|Owned]] - Single custom entity reference
- [[#Owned Multi Fields|Owned Multi]] - Multiple custom entity references

**Reference Field Types:**
- [[#User Fields|User]] - Single user reference
- [[#User Multi Fields|User Multi]] - Multiple user references

**Agile Field Types:**
- [[#Sprint Fields|Sprint]] - Single sprint reference
- [[#Sprint Multi Fields|Sprint Multi]] - Multiple sprint references

## Basic Field Types

### String Fields
Simple text fields for storing short text values.

**Type:** `string`

**Usage:**
- Short descriptions, names, codes
- Free-form text up to reasonable length
- Case-sensitive values

**Examples:**
```
Title: "Critical bug in login system"
Component: "authentication"
Bug_ID: "BUG-2024-001"
```

**Query Examples:**
```
subject: "Critical bug"
component: authentication
bug_id: "BUG-2024-001"
```

### Integer Fields
Whole number values for counts, scores, or numeric identifiers.

**Type:** `integer`

**Usage:**
- Story points, priority scores
- Counts, quantities
- Numeric codes or IDs

**Examples:**
```
Story Points: 5
PriorityScore: 100
Ticket Number: 12345
```

**Query Examples:**
```
"Story Points": 5
PriorityScore: 80 .. 100
"Ticket Number": 12345
```

### Float Fields
Decimal numbers for precise measurements or percentages.

**Type:** `float`

**Usage:**
- Progress percentages
- Measurements, ratios
- Any decimal values

**Examples:**
```
Progress: 85.5
Completion Ratio: 0.75
Time Estimate: 2.5
```

**Query Examples:**
```
Progress: 85.5
"Completion Ratio": 0.5 .. 1.0
"Time Estimate": 2.0 .. 3.0
```

### Boolean Fields
True/false values for binary options or flags.

**Type:** `boolean`

**Usage:**
- Feature flags, options
- Binary states (enabled/disabled, public/private)
- Yes/no questions

**Examples:**
```
IsFeature: true
IsPublic: false
Needs Review: true
```

**Query Examples:**
```
IsFeature: true
IsPublic: false
"Needs Review": true
```

### Date Fields
Date-only values (no time component).

**Type:** `date`

**Usage:**
- Deadlines, milestones
- Release dates
- Any date without time significance

**Format:** ISO 8601 date format (`YYYY-MM-DD`)

**Examples:**
```
Deadline: 2024-12-31
Release Date: 2024-06-15
Milestone: 2024-03-01
```

**Query Examples:**
```
Deadline: 2024-12-31
"Release Date": 2024-06-01 .. 2024-06-30
Milestone: 2024-01-01 .. inf
```

### DateTime Fields
Full timestamp values with date and time.

**Type:** `datetime`

**Usage:**
- Precise timestamps
- Scheduled events
- Time-sensitive deadlines

**Format:** ISO 8601 datetime format (`YYYY-MM-DDTHH:MM:SS`)

**Examples:**
```
Scheduled: 2024-06-15T14:30:00
Meeting Time: 2024-03-20T09:00:00
Deployment: 2024-12-31T23:59:59
```

**Query Examples:**
```
Scheduled: 2024-06-15T14:30:00
"Meeting Time": 2024-03-20T09:00:00 .. 2024-03-20T17:00:00
Deployment: now .. inf
```

### Duration Fields
Time duration values for tracking work estimates and time spent.

**Type:** `duration`

**Usage:**
- Time estimates, actual time spent
- SLA timeframes
- Any duration measurement

**Format:** Enter durations using time units like `2h 30m`, `1d 4h`, `45m`

**Examples:**
```
Time Estimate: 2h 30m
Time Spent: 1d 4h
SLA Duration: 3d
```

**Query Examples:**
```
"Time Estimate": 2h30m
"Time Spent": 1h .. 8h
"SLA Duration": 1d .. 1w
```

**Supported Units:**
- `s` - seconds
- `m` - minutes
- `h` - hours
- `d` - days
- `w` - weeks

**Example Formats:**
- `30m` - 30 minutes
- `2h` - 2 hours
- `1h 30m` - 1 hour 30 minutes
- `2d 4h` - 2 days 4 hours
- `1w 2d` - 1 week 2 days

## Choice-Based Field Types

### Enum Fields
Single-choice fields with predefined options.

**Type:** `enum`

**Usage:**
- Priority levels, categories
- Single-selection dropdowns
- Predefined classification values

**Configuration:**
Each enum option supports:
- **Value** - Display text for the option
- **Color** - Visual distinction for the option
- **Archived** - Hide option without losing historical data

**Examples:**
```
Priority: "High"
Category: "Bug"
Severity: "Critical"
```

**Query Examples:**
```
priority: High
category: Bug, Feature  # Bug OR Feature category
severity: Critical
```

### Enum Multi Fields
Multiple-choice fields allowing several selections from predefined options.

**Type:** `enum_multi`

**Usage:**
- Multiple categories
- Multi-selection options

**Configuration:**
Uses the same enum option metadata as single Enum fields (Value, Color, Archived).

**Examples:**
```
Categories: ["Bug", "Security"]
Platforms: ["Web", "Mobile", "API"]
```

**Query Examples:**
```
categories: Bug, Security  # Issues with Bug OR Security category
platforms: Web            # Issues that include Web platform
```

### State Fields
Special enum fields that track issue resolution and closure status.

**Type:** `state`

**Usage:**
- Issue states with workflow significance
- Resolution tracking
- Status with semantic meaning

**Configuration:**
Each state option supports:
- **Value** - State name (e.g., "Open", "Closed")
- **Resolved** - Whether this state marks issues as resolved
- **Closed** - Whether this state marks issues as closed
- **Color** - Visual distinction for the state
- **Archived** - Hide state without losing historical data
- Affects issue resolution status (`#resolved` / `#unresolved`)

**Examples:**
```
State: "Open"           # Not resolved, not closed
State: "Resolved"       # Resolved but not closed
State: "Closed"         # Resolved and closed
```

**Query Examples:**
```
state: Open
state: Resolved, Closed  # Either resolved or closed
#resolved                # All resolved states
#unresolved              # All unresolved states
```

### Version Fields
References to project versions with semantic meaning.

**Type:** `version`

**Usage:**
- Target versions, found in versions
- Release planning
- Version tracking

**Configuration:**
Each version option supports:
- **Value** - Version name (e.g., "v2.1.0")
- **Release Date** - Optional planned or actual release date
- **Released** - Whether this version has been released
- **Archived** - Hide version without losing historical data

**Examples:**
```
Target Version: "v2.1.0"
FoundIn: "v2.0.3"
FixedIn: "v2.0.4"
```

**Query Examples:**
```
"Target Version": "v2.1.0"
FoundIn: "v2.0.3"
FixedIn: "v2.0.4"
```

### Version Multi Fields
References to multiple versions.

**Type:** `version_multi`

**Usage:**
- Multiple target versions
- Backport tracking
- Multi-version features

**Configuration:**
Uses the same version option metadata as single Version fields (Value, Release Date, Released, Archived).

**Examples:**
```
Target Versions: ["v2.1.0", "v3.0.0"]
Backport To: ["v1.9.5", "v2.0.4"]
```

**Query Examples:**
```
"Target Versions": "v2.1.0"    # One of the target versions
"Backport To": "v1.9.5"        # One of the backport versions
```

### Owned Fields
References to custom owned entities (project-specific objects).

**Type:** `owned`

**Usage:**
- Project-specific entities
- Custom reference types
- Domain-specific objects

**Configuration:**
Each owned option supports:
- **Value** - Display name of the entity
- **Owner** - User who owns/maintains this entity
- **Color** - Visual distinction for the option
- **Archived** - Hide option without losing historical data

**Examples:**
```
Subsystem: "Authentication"
Module: "UserManagement"
Component: "LoginService"
```

**Query Examples:**
```
subsystem: Authentication
module: UserManagement
component: LoginService
```

### Owned Multi Fields
References to multiple owned entities.

**Type:** `owned_multi`

**Usage:**
- Multiple project entities
- Cross-cutting concerns
- Multi-component features

**Configuration:**
Uses the same owned option metadata as single Owned fields (Value, Owner, Color, Archived).

**Examples:**
```
Subsystems: ["Authentication", "Authorization"]
Modules: ["UserMgmt", "RoleMgmt", "PermMgmt"]
```

**Query Examples:**
```
subsystems: Authentication     # One of the subsystems
modules: UserMgmt             # One of the modules
```

## Reference Field Types

### User Fields
Reference to single users in the system.

**Type:** `user`

**Usage:**
- Assignees, reviewers
- Single person responsibility
- User references

**Configuration:**
- Options define available users (individuals or groups)
- Groups dynamically resolve to their members

**Examples:**
```
Assignee: john@company.com
Reviewer: mary@company.com
Reporter: admin@company.com
```

**Query Examples:**
```
assignee: john@company.com
reviewer: mary@company.com
reporter: me  # Current user
```

### User Multi Fields
Reference to multiple users in the system.

**Type:** `user_multi`

**Usage:**
- Multiple assignees
- Teams, committees
- Multiple person responsibility

**Examples:**
```
Assignees: ["john@company.com", "mary@company.com"]
Team: ["dev1@company.com", "dev2@company.com"]
Reviewers: ["senior1@company.com", "senior2@company.com"]
```

**Query Examples:**
```
assignees: john@company.com     # John is one of the assignees
team: dev1@company.com         # Dev1 is on the team
reviewers: me                  # Current user is a reviewer
```

## Agile Field Types

### Sprint Fields
References to agile sprints for project planning.

**Type:** `sprint`

**Usage:**
- Sprint assignment
- Agile planning
- Iteration tracking

**Configuration:**
Each sprint option supports:
- **Value** - Sprint name (e.g., "Sprint 23")
- **Start Date** - Sprint start date
- **End Date** - Sprint end date
- **Description** - Additional sprint information
- **Completed** - Whether the sprint is finished
- **Color** - Visual distinction for the sprint
- **Archived** - Hide sprint without losing historical data

**Examples:**
```
Sprint: "Sprint 23"
Current Sprint: "Q1-2024-Sprint-3"
Target Sprint: "Release-Sprint"
```

**Query Examples:**
```
Sprint: "Sprint 23"
"Current Sprint": "Q1-2024-Sprint-3"
"Target Sprint": "Release-Sprint"
```

### Sprint Multi Fields
References to multiple sprints.

**Type:** `sprint_multi`

**Usage:**
- Multi-sprint features
- Cross-sprint dependencies
- Flexible sprint assignment

**Configuration:**
Uses the same sprint option metadata as single Sprint fields (Value, Start Date, End Date, Description, Completed, Color, Archived).

**Examples:**
```
Sprints: ["Sprint 23", "Sprint 24"]
Related Sprints: ["Q1-Sprint-1", "Q1-Sprint-2"]
```

**Query Examples:**
```
Sprints: "Sprint 23"          # One of the sprints
"Related Sprints": "Q1-Sprint-1"  # One of the related sprints
```


## Best Practices

### Field Naming
- Use descriptive, consistent names
- Avoid spaces in field names for easier querying

### Default Values
- Set sensible defaults for required fields
- Use defaults to enforce conventions
- Consider workflow implications of default states

### Nullable vs Required Fields
- Make fields nullable (can be empty) unless truly required
- Non-nullable fields must always have values
- Consider user experience when making fields required

## Limitations

- Custom field names must be unique globally (shared across all bundles)
- Only one bundle within a field can be connected to the same project
- Archived options remain in historical data but aren't selectable
- Some field types have validation constraints (e.g., positive durations)
- User/group references must exist in the system
- Field type cannot be changed after creation (data compatibility)

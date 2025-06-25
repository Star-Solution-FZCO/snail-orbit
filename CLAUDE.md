# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Snail Orbit is a FastAPI + React TypeScript project management tool with a modern, scalable architecture. The system consists of:

- **Backend**: FastAPI (Python) with MongoDB/Beanie ODM, RabbitMQ, Taskiq tasks
- **Frontend**: React 19 + TypeScript with TanStack Router, Material-UI, Redux Toolkit
- **Architecture**: Event-driven microservices with real-time updates and workflow automation

## Development Commands

### Backend (app/)
```bash
# Run API server
python3 app/manage.py api server

# Run Taskiq worker
python3 app/manage.py tasks worker

# Run OCR worker
python3 app/manage.py ocr worker

# Run tests
cd app && python3 -m pytest

# Linting and formatting
cd app && ruff check --fix .
cd app && ruff format .
cd app && python3 lint.py  # Runs pylint
cd app && bandit -c pyproject.toml -r .

# Type checking
cd app && mypy pm

# Generate OpenAPI schema
python3 app/manage.py api openapi gen -o app/openapi.json

# Database migrations
python3 app/manage.py db init          # Initialize migration system
python3 app/manage.py db create <name> # Create new migration
python3 app/manage.py db up            # Apply all pending migrations
python3 app/manage.py db down          # Rollback all migrations
python3 app/manage.py db status        # Show migration status
python3 app/manage.py db up --revision <id>     # Apply to specific revision
python3 app/manage.py db down --revision <id>   # Rollback to specific revision
python3 app/manage.py db up --use-transactions  # Use transactions (replica set required)
```

### Frontend (frontend/)
```bash
# Development server
cd frontend && yarn dev

# Build for production
cd frontend && yarn build

# Linting and formatting
cd frontend && yarn lint
cd frontend && yarn prettier

# Type compilation
cd frontend && yarn compile

# Generate API types from OpenAPI
cd frontend && yarn api-gen-from-file

# Extract i18n strings
cd frontend && yarn extract

# Storybook
cd frontend && yarn storybook
```

### Docker
```bash
# Build backend services
docker build -f app/Dockerfile --target api -t snail-orbit-api app/
docker build -f app/Dockerfile --target tasks -t snail-orbit-tasks app/
docker build -f app/Dockerfile --target ocr -t snail-orbit-ocr app/

# Build frontend
docker build -f frontend/Dockerfile --target ui -t snail-orbit-ui .
```

## Architecture

### Backend Structure
- **`app/pm/models/`**: Core domain models (Issue, Project, User, CustomField, etc.)
- **`app/pm/api/routes/`**: FastAPI route handlers organized by version (/v1, /v2)
- **`app/pm/api/views/`**: Pydantic schemas for API input/output
- **`app/pm/services/`**: Business logic layer
- **`app/pm/tasks/`**: Taskiq async tasks and workflow engine
- **`app/pm/utils/`**: Utilities (encryption, file storage, MongoDB filters)
- **`app/manage.py`**: CLI entry point for all services

### Frontend Structure
- **`frontend/src/modules/`**: Feature modules (issues, projects, agile_boards, etc.)
- **`frontend/src/shared/`**: Shared utilities, API layer, store, UI components
- **`frontend/src/widgets/`**: Reusable complex components

### Key Models
- **Issue**: Central entity with custom fields, comments, attachments, history
- **Project**: Container with role-based permissions and workflows
- **CustomField**: Extensible field system (enum, state, version, user types)
- **Workflow**: Python-based automation scripts (scheduled/event-driven)
- **Board**: Agile kanban boards with configurable columns/swimlanes

### Authentication & Security
- JWT-based auth with refresh tokens
- OIDC integration for enterprise SSO
- Role-based access control at project level
- Field-level encryption for sensitive data
- Complete audit trails for all changes

### Real-time Features
- Server-sent events for live updates
- Redis event bus for cross-service communication
- WebSocket-like experience through SSE

## Code Standards

### Python (3.12+)

- **Package Manager**: Poetry (app/), Yarn (frontend/)
- **Formatting**: Ruff with single quotes, 160 char lines
- **Type Checking**: MyPy with strict settings
- **Testing**: pytest with async support
- **Type Annotations**: All function parameters and return values MUST be annotated
- **Avoid Any**: Use specific types instead of `Any` wherever possible
- **Pydantic Models**: All fields MUST have `Field(description="...")` for documentation
- **Code Comments**: DO NOT add inline comments or comments inside functions. Use docstrings only when necessary for documenting public APIs

#### Code Style Conventions

**String Quoting & Formatting:**
- Use single quotes (`'`) for strings, not double quotes
- 160 character line limit (configured in ruff/pylint)
- Modern union syntax: `str | None` instead of `Optional[str]` or `Union[str, None]`

**Import Organization:**
```python
# Standard library imports first
from datetime import datetime
from typing import Annotated, Self

# Third-party imports second (with consistent aliasing)
import beanie.operators as bo
from beanie import Document, PydanticObjectId
from fastapi import HTTPException

# Local imports last (absolute for cross-module, relative for same directory)
import pm.models as m
from pm.api.context import current_user
from ._base import CustomField
```

**Naming Conventions:**
- Classes: PascalCase (`UserCreate`, `IssueOutput`)
- Functions/variables: snake_case (`user_ctx`, `create_user`)
- Constants: UPPER_SNAKE_CASE (`UNKNOWN_ID`)
- Link fields: `*LinkField` pattern (`UserLinkField`)
- Enums: `*TypeT` or `*Type` pattern (`CustomFieldTypeT`)

**Async Patterns:**
- All database operations must be async
- Use `asyncio.gather()` for parallel operations
- Beanie ODM method chaining: `await m.User.find_one(m.User.id == user_id)`

**Error Handling:**
```python
# ✅ CORRECT - Consistent HTTP exception pattern
if not user:
    raise HTTPException(HTTPStatus.NOT_FOUND, 'User not found')
```

**Response Models:**
- Use wrapper classes: `SuccessPayloadOutput[T]`, `BaseListOutput[T]`
- Input validation with Pydantic models (`UserCreate`, `IssueUpdate`)

#### Type Annotation Examples

```python
# ✅ CORRECT - Proper type annotations
from typing import Optional, List, Dict, Union
from pydantic import BaseModel, Field

def process_data(items: List[str], config: Dict[str, Union[str, int]]) -> Optional[str]:
    """Process data with proper type annotations."""
    return items[0] if items else None

# ❌ WRONG - Missing type annotations
def process_data(items, config):  # No type hints!
    return items[0] if items else None
```

#### Pydantic Model Examples

```python
# ✅ CORRECT - All fields with descriptions
class UserModel(BaseModel):
    id: int = Field(description="Unique user identifier")
    name: str = Field(description="User's full name")
    email: Optional[str] = Field(default=None, description="User's email address")
    is_active: bool = Field(default=True, description="Whether the user account is active")

# ❌ WRONG - Missing field descriptions
class UserModel(BaseModel):
    id: int  # No Field description!
    name: str
    email: Optional[str] = None
```

### Modern Syntax Requirements

**⚠️ CRITICAL REQUIREMENT** - This project uses modern versions with breaking changes. You MUST use the correct syntax:

#### Pydantic v2 Syntax (2.0+)

```python
# ✅ CORRECT - Use model_config = ConfigDict()
from pydantic import BaseModel, ConfigDict

class MyModel(BaseModel):
    name: str
    model_config = ConfigDict(
        from_attributes=True,
        validate_by_name=True,
    )

# ❌ WRONG - Old Pydantic v1 class Config syntax  
class MyModel(BaseModel):
    name: str
    class Config:  # This is deprecated!
        from_attributes = True
```

### Frontend Code Style
- TypeScript strict mode enabled
- Material-UI for all UI components
- React Hook Form + Yup for form validation
- TanStack Router for type-safe routing

### Custom Fields System
When working with custom fields:
- Base types in `pm/models/custom_fields/_base.py`
- Specific implementations: `enum_cf.py`, `state_cf.py`, `user_cf.py`, etc.
- Frontend components in `features/custom_fields/`
- Field values are stored in `CustomFieldValue` with type discrimination

### API Patterns
- Use Beanie ODM models directly in routes when possible
- Pydantic views for input validation and output serialization
- Link fields for referencing other documents (e.g., `UserLinkField`)
- MongoDB aggregation for complex queries

## Testing

### Backend Tests
- Located in `app/tests/`
- Uses pytest with async support
- Configuration in `app/pyproject.toml` under `[tool.pytest.ini_options]`
- Run with: `cd app && python3 -m pytest`

### Task Tests

**Unit Tests Only:**
- Located in `app/tests/tasks/test_task_integration.py`
- Test task business logic, configuration validation, and error handling
- No external dependencies required (uses mocks for RabbitMQ, database, external APIs)
- Run with: `cd app && python3 -m pytest tests/tasks/ -v`

**Test Coverage:**
- Async task execution with database setup
- Email task configuration and SMTP error handling  
- Pararam notification task with API mocking
- Workflow task execution logic
- RabbitMQ broker configuration validation
- Retry policy verification
- Logging behavior testing

**Note:** Only unit tests are implemented for the task system, using mocks instead of integration tests that would require live RabbitMQ connections.

### Test Database
- Uses MongoDB connection from `settings.toml`

## Pre-commit Hooks

The repository uses pre-commit hooks that run:
1. `ruff check --fix` and `ruff format` for Python formatting
2. `python3 app/lint.py` for pylint checks  
3. `bandit` for security analysis
4. `prettier` for frontend formatting
5. OpenAPI schema generation
6. `gitleaks` for secret detection

**Workflow**: Run `pre-commit run` before `git commit` to ensure all hooks pass. The hooks will also run automatically during commit, but it's better to run them first to catch issues early.

## Configuration

- Backend config in `app/settings.toml` using Dynaconf
- Environment-specific overrides supported
- Frontend config in `frontend/env.template.js` for build-time variables

### Task Queue Configuration

**Required Settings:**
```toml
# RabbitMQ broker for task queue (required)
TASKS_BROKER_URL = "amqp://user:password@localhost:5672/"

# Optional SMTP settings for email tasks
SMTP_HOST = "smtp.example.com"
SMTP_PORT = 587
SMTP_LOGIN = "user@example.com"
SMTP_PASSWORD = "password"
SMTP_SENDER = "noreply@example.com"
SMTP_SSL_MODE = "tls"  # or "ssl" or null

# Optional Pararam notification settings
PARARAM_NOTIFICATION_BOT_TOKEN = "your-bot-token"

# Optional WB sync settings
WB_SYNC_ENABLED = true
WB_URL = "https://wb.example.com"
WB_API_TOKEN_KID = "your-key-id"
WB_API_TOKEN_SECRET = "your-secret"
```

**Environment Variables:**
- `SNAIL_ORBIT_TASKS_BROKER_URL` - AMQP URL for RabbitMQ broker
- `SNAIL_ORBIT_SMTP_HOST` - SMTP server hostname
- `SNAIL_ORBIT_PARARAM_NOTIFICATION_BOT_TOKEN` - Bot token for notifications

## OpenAPI Integration

The backend automatically generates OpenAPI schemas that drive frontend TypeScript types:
1. Backend exports schema to `app/openapi.json`
2. Frontend generates types: `yarn api-gen-from-file` 
3. Types end up in `frontend/src/shared/model/types/backend-schema.gen.ts`

Always regenerate types after backend API changes.

## Task Queue Monitoring

### Health Checks
Task system health can be monitored through:
- **RabbitMQ Connection**: Workers will fail to start if RabbitMQ is unreachable
- **Task Processing**: Monitor task completion rates and errors in worker logs
- **Queue Status**: Use RabbitMQ management interface or CLI tools

### Troubleshooting
```bash
# Check RabbitMQ connection
docker exec -it rabbitmq-container rabbitmq-diagnostics ping

# View task queue status
docker exec -it rabbitmq-container rabbitmqctl list_queues

# View task logs
docker-compose logs tasks-worker
docker-compose logs tasks-beat

# Check worker startup and task registration
docker-compose logs tasks-worker | grep "Starting taskiq worker"
docker-compose logs tasks-worker | grep "Registered tasks"

# RabbitMQ management interface (if enabled)
# Access at http://localhost:15672 with guest/guest
```

### Task Types and Retry Policies
- **Email tasks**: 3 retries, 60s delay 
- **Pararam notifications**: 3 retries, 30s delay  
- **Issue notifications**: 2 retries, 30s delay (to avoid spam)
- **Workflow execution**: 1 retry, 60s delay (to avoid duplicate execution)
- **WB sync**: Runs every 5 minutes if enabled
- **Workflow scheduler**: Runs every minute to check scheduled workflows

### Task Architecture
- **Async Tasks**: All tasks are async functions with proper database setup
- **Message Persistence**: RabbitMQ queues are durable with persistent messages
- **Worker Startup**: Programmatic startup with proper logging and error handling
- **Task Discovery**: Registry-based task imports for clean separation

## Code Quality Requirements

**MANDATORY** - Before any commit or code changes, you MUST run these checks:

```bash
# 1. REQUIRED: Run all pre-commit hooks
pre-commit run                         # Run all quality checks on staged files

# 2. REQUIRED: Run tests separately
cd app && python3 -m pytest           # All tests must pass
```

**Critical Requirements:**

- ✅ **Pre-commit hooks** - All hooks MUST pass before committing
- ✅ **Tests passing** - All relevant tests must pass
- ✅ **Modern syntax** - MUST use Pydantic v2 (`model_config = ConfigDict()`)
- ✅ **Type annotations** - All function parameters and return values MUST be annotated

## Git Commit Guidelines

**CRITICAL REQUIREMENT** - When creating git commits:

- **NEVER** include attribution lines like `Generated with [Claude Code](https://claude.ai/code)` or `Co-Authored-By: Claude <noreply@anthropic.com>`
- **NEVER** push changes to git by yourself - only commit when explicitly requested
- Commit messages should be clean and professional without AI tool attribution
- Focus on describing the actual changes and their purpose
- Use conventional commit format when appropriate (feat:, fix:, refactor:, etc.)
- **ALWAYS** run `pre-commit run` before using `git commit` to ensure all hooks pass

## Development Tools

### Search Tools

**Important for macOS users:**

- **GNU grep location**: `/opt/homebrew/opt/grep/bin/ggrep`
- The system `grep` on macOS is BSD grep which has different options than GNU grep
- For GNU grep functionality, use `ggrep` or add to PATH: `/opt/homebrew/opt/grep/bin`
- **ripgrep (rg)** is available and preferred for fast searching

```bash
# Use GNU grep on macOS
/opt/homebrew/opt/grep/bin/ggrep -r "pattern" .

# Preferred: Use ripgrep for fast searching
rg "pattern" .
```
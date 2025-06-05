# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Snail Orbit is a FastAPI + React TypeScript project management tool with a modern, scalable architecture. The system consists of:

- **Backend**: FastAPI (Python) with MongoDB/Beanie ODM, Redis, Celery tasks
- **Frontend**: React 19 + TypeScript with TanStack Router, Material-UI, Redux Toolkit
- **Architecture**: Event-driven microservices with real-time updates and workflow automation

## Development Commands

### Backend (app/)
```bash
# Run API server
python3 app/manage.py api server

# Run Celery worker
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
python3 app/manage.py api db migrate
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
- **`app/pm/tasks/`**: Celery async tasks and workflow engine
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

## OpenAPI Integration

The backend automatically generates OpenAPI schemas that drive frontend TypeScript types:
1. Backend exports schema to `app/openapi.json`
2. Frontend generates types: `yarn api-gen-from-file` 
3. Types end up in `frontend/src/shared/model/types/backend-schema.gen.ts`

Always regenerate types after backend API changes.

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
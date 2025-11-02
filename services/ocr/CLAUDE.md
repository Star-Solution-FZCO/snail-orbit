# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the OCR (Optical Character Recognition) service for the Snail Orbit project. It's a microservice that processes images from S3 storage and extracts text using EasyOCR, integrated with the main application through NATS message queue.

**Key Technologies:**
- **OCR Engine**: EasyOCR v1.7.2 for text recognition
- **Message Queue**: NATS JetStream with pull-based broker
- **Storage**: S3-compatible storage (MinIO/AWS S3) for image files
- **Task Queue**: Taskiq for async task processing
- **Configuration**: Dynaconf for environment-based config management

## Architecture

### Service Structure
- **`ocr/worker.py`**: Main taskiq worker with OCR task implementation
- **`ocr/config.py`**: Configuration management with validation
- **`ocr/constants.py`**: Service constants and supported image types



## Development Commands

### Local Development
```bash
# Install dependencies
uv sync

# Run OCR worker
taskiq worker -w 1 --use-process-pool --max-process-pool-processes=1 ocr.worker:broker

# Test OCR functionality (see README.md for client example)

# Linting and formatting
ruff check --fix .
ruff format .

# Type checking
mypy ocr

# Run pylint
pylint ocr
```

### Docker Development
```bash
# Build OCR service image
docker build -f Dockerfile --target ocr -t snail-orbit-ocr .

# Run with mounted config
docker run -v /path/to/config:/app/etc -v /path/to/models:/var/easyocr snail-orbit-ocr
```

## Configuration

Configuration is managed through `settings.toml` files and environment variables using Dynaconf.

### Required Settings
```toml
# S3 Configuration (only credentials required)
[S3]
ACCESS_KEY_ID = "your-access-key"     # Required
SECRET_ACCESS_KEY = "your-secret-key" # Required
# Other S3 settings have defaults (see config.py validators)
```

### Optional Settings
All other settings have sensible defaults. See `ocr/config.py` for complete list of validators and defaults.

### Environment Variable Overrides
All settings can be overridden with environment variables prefixed with `OCR_`:
- `OCR_S3__ACCESS_KEY_ID`
- `OCR_S3__SECRET_ACCESS_KEY`
- `OCR_USE_GPU`
- `OCR_NATS__SERVERS`
- etc.

## Code Standards

### Python (3.12+)
- **Package Manager**: uv for dependency management
- **Formatting**: Ruff with single quotes, strict linting rules
- **Type Checking**: MyPy with strict mode enabled
- **Type Annotations**: All function parameters and return values MUST be annotated
- **Async Operations**: All I/O operations are async (S3, file operations)

### Code Style Conventions

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
import easyocr
from taskiq import Context, TaskiqDepends
from taskiq_nats import PullBasedJetStreamBroker

# Local imports last (absolute for cross-module, relative for same directory)
from ocr.config import CONFIG
from ocr.constants import IMAGE_TYPES
```

**Naming Conventions:**
- Classes: PascalCase (`TaskConfig`, `OCRResult`)
- Functions/variables: snake_case (`ocr_reader`, `process_image`)
- Constants: UPPER_SNAKE_CASE (`IMAGE_TYPES`, `CONFIG_PATHS`)

**Async Patterns:**
- All I/O operations must be async (S3, file operations)
- Use `asyncio.gather()` for parallel operations when applicable
- Proper error handling for S3 operations and OCR processing


## Task System Integration

### Task Definition
The service exposes one main task:
```python
@broker.task(task_name='ocr::recognize')
async def ocr_recognize(filepath: str, context: Context) -> str | None
```

### Usage from Main Application
See README.md for complete usage examples and code samples.


## Deployment

### Docker Deployment
- Uses multi-stage build for optimized image size
- Runs as non-root user `ocr` (UID 999, GID 998)
- Requires mounted volumes for configuration (`/app/etc`) and models (`/var/easyocr`)
- Single worker process with process pool for OCR operations

### Resource Requirements
See README.md for deployment requirements and resource specifications.

## Code Quality Requirements

**MANDATORY** - Before any commit or code changes, you MUST run these checks:

```bash
# REQUIRED: Run OCR service specific checks
ruff check --fix .
ruff format .
mypy ocr
pylint ocr
```

**Critical Requirements:**

- ✅ **Type annotations** - All function parameters and return values MUST be annotated
- ✅ **Code quality** - All linting and formatting checks must pass
- ✅ **No comments** - DO NOT add inline comments or comments inside functions. Use docstrings only when necessary for documenting public APIs

## Git Commit Guidelines

**CRITICAL REQUIREMENT** - When creating git commits:

- **NEVER** include attribution lines like `Generated with [Claude Code](https://claude.ai/code)` or `Co-Authored-By: Claude <noreply@anthropic.com>`
- **NEVER** push changes to git by yourself - only commit when explicitly requested
- **NEVER** stage files using `git add .` - ALWAYS add specific files that you changed (e.g., `git add ocr/worker.py ocr/config.py`)
- Commit messages should be clean and professional without AI tool attribution
- Focus on describing the actual changes and their purpose
- Use conventional commit format when appropriate (feat:, fix:, refactor:, etc.)
- **ALWAYS** run code quality checks before committing

## Troubleshooting

### Common Issues
1. **S3 Connection Errors**: Verify credentials and endpoint URL
2. **Model Download Failures**: Ensure internet access and sufficient disk space
3. **Memory Issues**: Increase container memory limits for large images
4. **NATS Connection**: Check NATS server availability and configuration

### Debug Commands (Docker Environment)
```bash
# Check container logs
docker logs <ocr-container-name>

# Exec into running container for debugging
docker exec -it <ocr-container-name> /bin/sh

# Inside container - check configuration
python -c "from ocr.config import CONFIG; print(dict(CONFIG))"

# Inside container - test S3 connectivity
python -c "import asyncio; from ocr.config import CONFIG; print(f'S3 Endpoint: {CONFIG.S3.ENDPOINT_URL}')"

# Check NATS connectivity from container
docker exec -it <nats-container> nats stream ls

# Monitor worker health via Docker
docker exec <ocr-container-name> ps aux

# Check mounted volumes and permissions
docker exec <ocr-container-name> ls -la /app/etc /var/easyocr
```
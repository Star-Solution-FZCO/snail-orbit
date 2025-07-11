"""
Error response constants and utilities for OpenAPI documentation.

This module provides both pre-generated error response constants and a flexible
`error_responses()` function for custom error combinations.

All schemas and examples are generated from actual Pydantic model instances
to ensure perfect consistency and eliminate manual duplication.

## Recommended Usage

Use predefined constants for common error patterns:

```python
from pm.api.views.error_responses import error_responses, AUTH_ERRORS, READ_ERRORS, WRITE_ERRORS, CRUD_ERRORS

# Common patterns using constants
@router.get('/{id}', responses=error_responses(*READ_ERRORS))        # 401, 403, 404
@router.post('/', responses=error_responses(*WRITE_ERRORS))          # 400, 401, 403, 422
@router.put('/{id}', responses=error_responses(*CRUD_ERRORS))        # 400, 401, 403, 404, 422

# Router-level auth errors
router = APIRouter(responses=error_responses(*AUTH_ERRORS))          # 401, 403

# Custom combinations
@router.post('/special', responses=error_responses(
    *WRITE_ERRORS,
    (HTTPStatus.CONFLICT, ErrorOutput),
))
```

### Available Constants

- **`AUTH_ERRORS`**: Authentication/authorization (401, 403)
- **`READ_ERRORS`**: Read operations (401, 403, 404)
- **`WRITE_ERRORS`**: Write operations (400, 401, 403, 422)
- **`CRUD_ERRORS`**: Full CRUD operations (400, 401, 403, 404, 422)

### Manual Specifications (for custom cases)

```python
from http import HTTPStatus
from pm.api.views.output import ErrorOutput, ErrorPayloadOutput

# Custom error responses
@router.post('/custom', responses=error_responses(
    (HTTPStatus.BAD_REQUEST, ErrorPayloadOutput),
    (HTTPStatus.CONFLICT, ErrorOutput),
))
```

## Automatic Response Merging

The custom APIRouter automatically merges router-level and route-level responses:

```python
# Router defines auth errors (401, 403)
router = APIRouter(responses=error_responses(*AUTH_ERRORS))

# Route adds specific errors - automatically merged!
@router.get('/{id}', responses=error_responses(
    (HTTPStatus.NOT_FOUND, ErrorOutput)
))
# Final OpenAPI: 401, 403 (from router) + 404 (from route)

# Conflict resolution when same status code is used:
@router.put('/{id}', responses=error_responses(
    (HTTPStatus.FORBIDDEN, ErrorOutput),  # Same as router's 403
    (HTTPStatus.NOT_FOUND, ErrorOutput)
))
# Result: Route's 403 wins (same schema), router's 401 preserved
# Final OpenAPI: 401, 403 (route version), 404

# Different schemas create oneOf automatically:
@router.post('/login', responses=error_responses(
    (HTTPStatus.UNAUTHORIZED, ErrorPayloadOutput)  # Different from router's ErrorOutput
))
# Result: 401 becomes oneOf[ErrorOutput, ErrorPayloadOutput], 403 preserved
```

**Merging Rules:**
- **No conflict**: Simple addition of new status codes
- **Same status + same schema**: Route wins (allows override)
- **Same status + different schemas**: Creates oneOf combining both
- **Examples**: Automatically merged from both sources

"""

from http import HTTPStatus
from typing import Any

from pydantic import BaseModel

from .output import ErrorOutput

# Common error response tuple patterns for reuse
AUTH_ERRORS = (
    (HTTPStatus.UNAUTHORIZED, ErrorOutput),
    (HTTPStatus.FORBIDDEN, ErrorOutput),
)

READ_ERRORS = (
    (HTTPStatus.UNAUTHORIZED, ErrorOutput),
    (HTTPStatus.FORBIDDEN, ErrorOutput),
    (HTTPStatus.NOT_FOUND, ErrorOutput),
)

WRITE_ERRORS = (
    (HTTPStatus.BAD_REQUEST, ErrorOutput),
    (HTTPStatus.UNAUTHORIZED, ErrorOutput),
    (HTTPStatus.FORBIDDEN, ErrorOutput),
    (HTTPStatus.UNPROCESSABLE_ENTITY, ErrorOutput),
)

CRUD_ERRORS = (
    (HTTPStatus.BAD_REQUEST, ErrorOutput),
    (HTTPStatus.UNAUTHORIZED, ErrorOutput),
    (HTTPStatus.FORBIDDEN, ErrorOutput),
    (HTTPStatus.NOT_FOUND, ErrorOutput),
    (HTTPStatus.UNPROCESSABLE_ENTITY, ErrorOutput),
)

WRITE_ERRORS_WITH_CONFLICT = (
    (HTTPStatus.BAD_REQUEST, ErrorOutput),
    (HTTPStatus.UNAUTHORIZED, ErrorOutput),
    (HTTPStatus.FORBIDDEN, ErrorOutput),
    (HTTPStatus.CONFLICT, ErrorOutput),
    (HTTPStatus.UNPROCESSABLE_ENTITY, ErrorOutput),
)

CRUD_ERRORS_WITH_CONFLICT = (
    (HTTPStatus.BAD_REQUEST, ErrorOutput),
    (HTTPStatus.UNAUTHORIZED, ErrorOutput),
    (HTTPStatus.FORBIDDEN, ErrorOutput),
    (HTTPStatus.NOT_FOUND, ErrorOutput),
    (HTTPStatus.CONFLICT, ErrorOutput),
    (HTTPStatus.UNPROCESSABLE_ENTITY, ErrorOutput),
)


# Status code descriptions mapping
STATUS_DESCRIPTIONS = {
    400: 'Bad Request - Invalid request, validation errors, or MFA required',
    401: 'Unauthorized - Authentication required or invalid credentials',
    403: 'Forbidden - Insufficient permissions',
    404: 'Not Found - Resource not found',
    409: 'Conflict - Resource already exists or is in conflicting state',
    422: 'Unprocessable Entity - Request validation failed',
    500: 'Internal Server Error - An unexpected error occurred',
}

__all__ = (
    'error_responses',
    'AUTH_ERRORS',
    'READ_ERRORS',
    'WRITE_ERRORS',
    'CRUD_ERRORS',
    'WRITE_ERRORS_WITH_CONFLICT',
    'CRUD_ERRORS_WITH_CONFLICT',
    'NOT_FOUND_RESPONSES',
)


def _generate_error_response_schema(
    model_class: type[BaseModel], description: str
) -> dict[str, Any]:
    """Generate an OpenAPI error response schema from a Pydantic model."""
    return {
        'description': description,
        'content': model_class.get_openapi_content(),
    }


def error_responses(
    *specs: tuple[HTTPStatus, type[BaseModel]],
) -> dict[int, dict[str, Any]]:
    """
    Create error response specifications using HTTPStatus enums and model classes.

    This is the recommended way to specify error responses for routes.

    Args:
        *specs: Tuples of (HTTPStatus, model_class). Multiple tuples with the same
                status code will be combined using oneOf schema.

    Returns:
        Dict mapping status codes to OpenAPI response schemas

    Example:
        ```python
        from http import HTTPStatus
        from pm.api.views.error_responses import error_responses
        from pm.api.views.output import ErrorOutput, ErrorPayloadOutput, MFARequiredOutput

        # Single error type per status code
        @router.get('/{id}', responses=error_responses(
            (HTTPStatus.NOT_FOUND, ErrorOutput),
            (HTTPStatus.UNAUTHORIZED, ErrorOutput)
        ))

        # Multiple error types for same status code
        @router.post('/login', responses=error_responses(
            (HTTPStatus.BAD_REQUEST, ErrorOutput),
            (HTTPStatus.BAD_REQUEST, ErrorPayloadOutput),
            (HTTPStatus.BAD_REQUEST, MFARequiredOutput),
            (HTTPStatus.UNAUTHORIZED, ErrorOutput)
        ))
        ```
    """
    # Group specs by status code
    status_groups: dict[int, list[type[BaseModel]]] = {}
    for status_code, model_class in specs:
        status_int = int(status_code)
        if status_int not in status_groups:
            status_groups[status_int] = []
        status_groups[status_int].append(model_class)

    responses = {}

    for status_int, model_classes in status_groups.items():
        # Remove duplicates while preserving order
        unique_models = []
        for model in model_classes:
            if model not in unique_models:
                unique_models.append(model)

        if len(unique_models) == 1:
            # Single model - use simple schema
            model_class = unique_models[0]
            description = STATUS_DESCRIPTIONS.get(status_int, f'Error {status_int}')
            responses[status_int] = _generate_error_response_schema(
                model_class, description
            )
        else:
            # Multiple models - use oneOf schema
            responses[status_int] = _generate_multi_model_response_schema(
                status_int, unique_models
            )

    return responses


def _generate_multi_model_response_schema(
    status_int: int, model_classes: list[type[BaseModel]]
) -> dict[str, Any]:
    """Generate oneOf schema for multiple model classes."""
    # Get description from our mapping
    description = STATUS_DESCRIPTIONS.get(status_int, f'Error {status_int}')

    # Collect all examples from each model
    all_examples = {}
    schemas = []

    for model_class in model_classes:
        schemas.append({'$ref': f'#/components/schemas/{model_class.__name__}'})

        # Get examples for this specific model
        model_content = model_class.get_openapi_content()
        model_examples = model_content['application/json'].get('examples', {})

        # Add model-specific prefix to example names to avoid conflicts
        model_name = model_class.__name__.lower().replace('output', '')
        for example_name, example_data in model_examples.items():
            prefixed_name = f'{model_name}_{example_name}'
            all_examples[prefixed_name] = example_data

    return {
        'description': description,
        'content': {'application/json': {'oneOf': schemas, 'examples': all_examples}},
    }


# Common 404 responses for convenience
NOT_FOUND_RESPONSES = error_responses((HTTPStatus.NOT_FOUND, ErrorOutput))

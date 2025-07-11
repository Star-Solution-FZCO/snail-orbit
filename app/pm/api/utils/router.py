"""
Enhanced APIRouter with automatic response merging and trailing slash fixes.

Fixes:
- Trailing slash issue: https://github.com/fastapi/fastapi/discussions/7298
- Automatic merging of router-level and route-level error responses
"""

from collections.abc import Callable
from typing import Any

from fastapi import APIRouter as FastAPIRouter
from fastapi.types import DecoratedCallable

__all__ = ('APIRouter',)


class APIRouter(FastAPIRouter):
    def api_route(
        self, path: str, *, include_in_schema: bool = True, **kwargs: Any
    ) -> Callable[[DecoratedCallable], DecoratedCallable]:
        # Handle trailing slash normalization
        if path.endswith('/') and len(self.prefix + path) > 1:
            path = path[:-1]

        # Merge router-level and route-level responses automatically
        kwargs = self._merge_responses(kwargs)

        add_path = super().api_route(
            path, include_in_schema=include_in_schema, **kwargs
        )

        alternate_path = path + '/'
        add_alternate_path = super().api_route(
            alternate_path, include_in_schema=False, **kwargs
        )

        def decorator(func: DecoratedCallable) -> DecoratedCallable:
            add_alternate_path(func)
            return add_path(func)

        return decorator

    def _merge_responses(self, kwargs: dict[str, Any]) -> dict[str, Any]:
        """
        Automatically merge router-level and route-level responses.

        Handles conflicts intelligently:
        - Same status + same model: Route wins (allows override)
        - Same status + different models: Creates oneOf schema
        - Different status codes: Simple merge
        """
        route_responses = kwargs.get('responses')

        # No route responses or no router responses - nothing to merge
        if not route_responses or not self.responses:
            return kwargs

        merged_responses = dict(self.responses)  # Start with router responses

        for status_code, route_response in route_responses.items():
            status_int = (
                int(status_code) if isinstance(status_code, str) else status_code
            )

            if status_int not in merged_responses:
                # No conflict - simple addition
                merged_responses[status_int] = route_response
            else:
                # Conflict detected - need intelligent merging
                router_response = merged_responses[status_int]
                merged_response = self._merge_conflicting_responses(
                    router_response, route_response
                )
                merged_responses[status_int] = merged_response

        # Update kwargs with merged responses
        kwargs = dict(kwargs)
        kwargs['responses'] = merged_responses
        return kwargs

    def _merge_conflicting_responses(
        self,
        router_response: dict[str, Any],
        route_response: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Merge two conflicting response definitions for the same status code.

        Strategy:
        1. If both use the same schema - route wins (allows override)
        2. If different schemas - create oneOf combining both
        3. Merge examples from both responses
        """
        # Extract schema information
        router_content = router_response.get('content', {}).get('application/json', {})
        route_content = route_response.get('content', {}).get('application/json', {})

        router_schema = router_content.get('schema', {})
        route_schema = route_content.get('schema', {})

        # Check if schemas are the same (by comparing $ref or title)
        router_ref = router_schema.get('$ref', router_schema.get('title', ''))
        route_ref = route_schema.get('$ref', route_schema.get('title', ''))

        if router_ref == route_ref:
            # Same schema - route wins, but merge examples
            merged_examples = {}
            merged_examples.update(router_content.get('examples', {}))
            merged_examples.update(route_content.get('examples', {}))

            result = dict(route_response)
            if merged_examples:
                result['content']['application/json']['examples'] = merged_examples
            return result

        # Different schemas - create oneOf
        one_of_schemas = []
        all_examples = {}

        # Add router schema
        if router_schema:
            one_of_schemas.append(router_schema)
            for name, example in router_content.get('examples', {}).items():
                all_examples[f'router_{name}'] = example

        # Add route schema
        if route_schema:
            one_of_schemas.append(route_schema)
            for name, example in route_content.get('examples', {}).items():
                all_examples[f'route_{name}'] = example

        # Create combined description
        route_desc = route_response.get('description', '')
        combined_desc = f'{route_desc} (combined with router-level responses)'

        return {
            'description': combined_desc,
            'content': {
                'application/json': {
                    'oneOf': one_of_schemas,
                    'examples': all_examples,
                }
            },
        }

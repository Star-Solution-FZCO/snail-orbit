"""
Unit tests for APIRouter automatic response merging functionality.

These tests verify that the custom APIRouter correctly merges router-level
and route-level error responses using intelligent conflict resolution.

Tests use real route registration to verify end-to-end functionality with pytest.
"""

from typing import Any

from pm.api.utils.router import APIRouter

# Mock error response data for testing (avoiding full pm imports)
MOCK_ERROR_OUTPUT_SCHEMA = {'$ref': '#/components/schemas/ErrorOutput'}
MOCK_ERROR_PAYLOAD_OUTPUT_SCHEMA = {'$ref': '#/components/schemas/ErrorPayloadOutput'}


def create_mock_error_response(
    status_code: int,
    schema_ref: str,
    description: str,
) -> dict[str, Any]:
    """Create a mock error response for testing."""
    return {
        status_code: {
            'description': description,
            'content': {
                'application/json': {
                    'schema': {'$ref': schema_ref},
                    'examples': {
                        f'example_{status_code}': {
                            'summary': f'Example {status_code}',
                            'value': {'error_messages': [f'Error {status_code}']},
                        },
                    },
                },
            },
        },
    }


def create_mock_auth_responses() -> dict[int, dict[str, Any]]:
    """Create mock auth error responses (401, 403)."""
    responses = {}
    responses.update(
        create_mock_error_response(
            401,
            '#/components/schemas/ErrorOutput',
            'Unauthorized',
        ),
    )
    responses.update(
        create_mock_error_response(
            403, '#/components/schemas/ErrorOutput', 'Forbidden'
        ),
    )
    return responses


def test_no_router_responses():
    """When router has no responses, route responses are used as-is."""
    router = APIRouter()
    route_responses = create_mock_error_response(
        404,
        '#/components/schemas/ErrorOutput',
        'Not Found',
    )

    @router.get('/test', responses=route_responses)
    async def test_endpoint():
        return {'test': True}

    # Find registered route
    route = next((r for r in router.routes if hasattr(r, 'responses')), None)
    assert route is not None
    assert route.responses == route_responses


def test_no_route_responses():
    """When route has no responses, only router responses are used."""
    router_responses = create_mock_error_response(
        401,
        '#/components/schemas/ErrorOutput',
        'Unauthorized',
    )
    router = APIRouter(responses=router_responses)

    @router.get('/test')  # No responses parameter
    async def test_endpoint():
        return {'test': True}

    # Find registered route
    route = next((r for r in router.routes if hasattr(r, 'responses')), None)
    assert route is not None
    assert route.responses == router_responses


def test_simple_addition_no_conflicts():
    """When no status codes overlap, responses are simply merged."""
    # Router has auth errors
    router_responses = create_mock_auth_responses()  # 401, 403
    router = APIRouter(responses=router_responses)

    # Route has different errors
    route_responses = {}
    route_responses.update(
        create_mock_error_response(
            404, '#/components/schemas/ErrorOutput', 'Not Found'
        ),
    )
    route_responses.update(
        create_mock_error_response(
            422,
            '#/components/schemas/ErrorOutput',
            'Unprocessable Entity',
        ),
    )

    @router.get('/test', responses=route_responses)
    async def test_endpoint():
        return {'test': True}

    # Find registered route and check merged responses
    route = next((r for r in router.routes if hasattr(r, 'responses')), None)
    assert route is not None

    merged = route.responses
    assert set(merged.keys()) == {401, 403, 404, 422}

    # Each response should be properly formatted
    for status_code in [401, 403, 404, 422]:
        assert 'description' in merged[status_code]
        assert 'content' in merged[status_code]


def test_same_schema_route_wins():
    """When same status code + same schema, route should override router."""
    router_responses = create_mock_error_response(
        403,
        '#/components/schemas/ErrorOutput',
        'Router Forbidden',
    )
    router = APIRouter(responses=router_responses)

    route_responses = create_mock_error_response(
        403,
        '#/components/schemas/ErrorOutput',
        'Route Forbidden',
    )
    kwargs = {'responses': route_responses}

    result = router._merge_responses(kwargs)
    merged = result['responses']

    # Should have only 403
    assert list(merged.keys()) == [403]

    # Should be route version (no oneOf since same schema)
    response_403 = merged[403]
    assert 'oneOf' not in response_403['content']['application/json']
    assert 'schema' in response_403['content']['application/json']
    assert response_403['description'] == 'Route Forbidden'


def test_different_schemas_create_one_of():
    """When same status code + different schemas, should create oneOf."""
    router_responses = create_mock_error_response(
        400,
        '#/components/schemas/ErrorOutput',
        'Router Bad Request',
    )
    router = APIRouter(responses=router_responses)

    route_responses = create_mock_error_response(
        400,
        '#/components/schemas/ErrorPayloadOutput',
        'Route Bad Request',
    )
    kwargs = {'responses': route_responses}

    result = router._merge_responses(kwargs)
    merged = result['responses']

    # Should have only 400
    assert list(merged.keys()) == [400]

    # Should have oneOf combining both schemas
    response_400 = merged[400]
    content = response_400['content']['application/json']
    assert 'oneOf' in content
    assert len(content['oneOf']) == 2

    # Should have examples from both
    assert 'examples' in content
    assert len(content['examples']) > 0


def test_example_merging():
    """Test that examples are properly merged from both sources."""
    # Create manual responses with examples to test merging
    router_responses = {
        401: {
            'description': 'Router auth',
            'content': {
                'application/json': {
                    'schema': {'$ref': '#/components/schemas/ErrorOutput'},
                    'examples': {
                        'router_example': {
                            'summary': 'Router',
                            'value': {'error': 'router'},
                        },
                    },
                },
            },
        },
    }
    router = APIRouter(responses=router_responses)

    route_responses = {
        401: {
            'description': 'Route auth',
            'content': {
                'application/json': {
                    'schema': {'$ref': '#/components/schemas/ErrorOutput'},
                    'examples': {
                        'route_example': {
                            'summary': 'Route',
                            'value': {'error': 'route'},
                        },
                    },
                },
            },
        },
    }
    kwargs = {'responses': route_responses}

    result = router._merge_responses(kwargs)
    merged = result['responses']

    # Should have both examples
    examples = merged[401]['content']['application/json']['examples']
    assert 'router_example' in examples
    assert 'route_example' in examples


def test_different_schemas_integration():
    """Test end-to-end integration: router and route both define same status with different schemas."""
    # Router has 401 with ErrorOutput
    router_responses = create_mock_error_response(
        401,
        '#/components/schemas/ErrorOutput',
        'Router Auth Error',
    )
    router = APIRouter(responses=router_responses)

    # Route also has 401 but with ErrorPayloadOutput (different schema)
    route_responses = create_mock_error_response(
        401,
        '#/components/schemas/ErrorPayloadOutput',
        'Route Validation Error',
    )

    @router.get('/test', responses=route_responses)
    async def test_endpoint():
        return {'message': 'test'}

    # Find the registered route and check its responses
    route = next(
        (r for r in router.routes if hasattr(r, 'path') and r.path == '/test'),
        None,
    )
    assert route is not None

    # Verify merged responses
    route_responses_dict = route.responses
    assert list(route_responses_dict.keys()) == [401]

    # Should have oneOf combining both schemas
    response_401 = route_responses_dict[401]
    content = response_401['content']['application/json']
    assert 'oneOf' in content
    assert len(content['oneOf']) == 2

    # Check that both schema refs are present
    schema_refs = [schema.get('$ref', '') for schema in content['oneOf']]
    assert '#/components/schemas/ErrorOutput' in schema_refs
    assert '#/components/schemas/ErrorPayloadOutput' in schema_refs


def test_same_schema_route_overrides_router():
    """Test router and route both define same status with same schema (route should win)."""
    # Router has 403 with ErrorOutput
    router_responses = create_mock_error_response(
        403,
        '#/components/schemas/ErrorOutput',
        'Router Forbidden',
    )
    router = APIRouter(responses=router_responses)

    # Route also has 403 with same ErrorOutput schema
    route_responses = create_mock_error_response(
        403,
        '#/components/schemas/ErrorOutput',
        'Route Forbidden',
    )

    @router.put('/test/{item_id}', responses=route_responses)
    async def test_endpoint(item_id: str):
        return {'message': 'test'}

    # Find the registered route and check its responses
    route = next(
        (
            r
            for r in router.routes
            if hasattr(r, 'path') and '/test/{item_id}' in r.path
        ),
        None,
    )
    assert route is not None

    # Check that the route has merged responses
    route_responses_dict = route.responses

    # Should have only 403
    assert list(route_responses_dict.keys()) == [403]

    # Should NOT have oneOf (same schema)
    response_403 = route_responses_dict[403]
    content = response_403['content']['application/json']
    assert 'oneOf' not in content
    assert 'schema' in content

    # Route should win - description should be from route
    assert response_403['description'] == 'Route Forbidden'


def test_complex_real_world_scenario():
    """Test complex real-world scenario with multiple routes and conflicts."""
    # Create router with auth responses
    router_responses = {}
    router_responses.update(
        create_mock_error_response(
            401,
            '#/components/schemas/ErrorOutput',
            'Unauthorized',
        ),
    )
    router_responses.update(
        create_mock_error_response(
            403, '#/components/schemas/ErrorOutput', 'Forbidden'
        ),
    )

    router = APIRouter(prefix='/tag', responses=router_responses)

    # Add GET route
    get_responses = create_mock_error_response(
        404,
        '#/components/schemas/ErrorOutput',
        'Tag not found',
    )

    @router.get('/{tag_id}', responses=get_responses)
    async def get_tag(tag_id: str):
        return {'id': tag_id}

    # Add PUT route with conflict
    put_responses = {}
    put_responses.update(
        create_mock_error_response(
            404,
            '#/components/schemas/ErrorOutput',
            'Tag not found',
        ),
    )
    put_responses.update(
        create_mock_error_response(
            403,
            '#/components/schemas/ErrorOutput',
            'Custom forbidden',
        ),
    )
    put_responses.update(
        create_mock_error_response(
            422,
            '#/components/schemas/ErrorOutput',
            'Validation error',
        ),
    )

    @router.put('/{tag_id}', responses=put_responses)
    async def update_tag(tag_id: str):
        return {'id': tag_id}

    # Find routes
    routes = {}
    for route in router.routes:
        if hasattr(route, 'path') and '{tag_id}' in route.path:
            if route.methods == {'GET'}:
                routes['get'] = route
            elif route.methods == {'PUT'}:
                routes['put'] = route

    assert 'get' in routes
    assert 'put' in routes

    # Verify GET route merging
    get_responses_dict = routes['get'].responses
    assert set(get_responses_dict.keys()) == {401, 403, 404}

    # Verify PUT route merging with conflict resolution
    put_responses_dict = routes['put'].responses
    assert set(put_responses_dict.keys()) == {401, 403, 404, 422}

    # 403 should be overridden by route
    put_403 = put_responses_dict[403]
    assert put_403['description'] == 'Custom forbidden'
    assert 'oneOf' not in put_403['content']['application/json']


def test_preserve_other_kwargs():
    """Test that other kwargs are preserved during merging."""
    router_responses = create_mock_error_response(
        401,
        '#/components/schemas/ErrorOutput',
        'Unauthorized',
    )
    router = APIRouter(responses=router_responses)

    route_responses = create_mock_error_response(
        404,
        '#/components/schemas/ErrorOutput',
        'Not Found',
    )
    kwargs = {
        'responses': route_responses,
        'summary': 'Test endpoint',
        'description': 'Test description',
        'tags': ['test'],
    }

    result = router._merge_responses(kwargs)

    # Should preserve all other kwargs
    assert result['summary'] == 'Test endpoint'
    assert result['description'] == 'Test description'
    assert result['tags'] == ['test']

    # Should merge responses
    assert set(result['responses'].keys()) == {401, 404}


def test_router_method_merging():
    """Test that _merge_responses method works correctly in isolation."""
    router_responses = create_mock_error_response(
        401,
        '#/components/schemas/ErrorOutput',
        'Unauthorized',
    )
    router = APIRouter(responses=router_responses)

    route_responses = create_mock_error_response(
        404,
        '#/components/schemas/ErrorOutput',
        'Not Found',
    )
    kwargs = {'responses': route_responses}

    result = router._merge_responses(kwargs)

    # Should have both status codes
    assert set(result['responses'].keys()) == {401, 404}

    # Should preserve original responses
    assert result['responses'][401]['description'] == 'Unauthorized'
    assert result['responses'][404]['description'] == 'Not Found'

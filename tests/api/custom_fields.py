from typing import TYPE_CHECKING

import pytest
import pytest_asyncio

if TYPE_CHECKING:
    from fastapi.testclient import TestClient


__all__ = ('create_custom_field',)

CUSTOM_FIELDS_PLAIN_TYPES = (
    'string',
    'integer',
    'float',
    'boolean',
    'datetime',
    'date',
)


async def _create_custom_field_plain(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    custom_field_payload: dict,
) -> dict:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    if custom_field_payload['type'] not in CUSTOM_FIELDS_PLAIN_TYPES:
        pytest.xfail('Unsupported custom field type')
    response = test_client.post(
        '/api/v1/custom_field',
        headers=headers,
        json=custom_field_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['payload']['id']
    assert data == {
        'success': True,
        'payload': {'id': data['payload']['id'], **custom_field_payload},
    }, f'{data=}'
    return {'id': data['payload']['id']}


async def _create_custom_field_enum(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    custom_field_payload: dict,
) -> dict:
    custom_field_payload = custom_field_payload.copy()
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    if custom_field_payload['type'] not in ('enum', 'enum_multi'):
        pytest.xfail('Unsupported custom field type')
    if options := custom_field_payload.get('options', []):
        del custom_field_payload['options']
    response = test_client.post(
        '/api/v1/custom_field',
        headers=headers,
        json=custom_field_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['payload']['id']
    assert data == {
        'success': True,
        'payload': {'id': data['payload']['id'], **custom_field_payload, 'options': []},
    }, f'{data=}'

    async def _add_option(opt: dict) -> tuple[str, str]:
        resp_ = test_client.post(
            f'/api/v1/custom_field/{data["payload"]["id"]}/option',
            headers=headers,
            json=opt,
        )
        assert resp_.status_code == 200
        data_ = resp_.json()
        assert data_['payload']['id'] == data['payload']['id']
        opts_ = data_['payload'].pop('options')
        assert data_ == {
            'success': True,
            'payload': {'id': data['payload']['id'], **custom_field_payload},
        }, f'{data_=}'
        opt_ = next(filter(lambda x: x['value'] == opt['value'], opts_), None)
        assert opt_, f'{opts_=}'
        assert opt_.get('uuid'), f'{opt_=}'
        assert opt_ == {'uuid': opt_['uuid'], **opt}
        return opt_['uuid'], opt['value']

    option_ids = {}
    for option in options:
        opt_id, opt_val = await _add_option(option)
        option_ids[opt_val] = opt_id
    return {'id': data['payload']['id'], 'options': option_ids}


async def _create_custom_field_state(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    custom_field_payload: dict,
) -> dict:
    custom_field_payload = custom_field_payload.copy()
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    if custom_field_payload['type'] != 'state':
        pytest.xfail('Unsupported custom field type')
    if options := custom_field_payload.get('options', []):
        del custom_field_payload['options']
    response = test_client.post(
        '/api/v1/custom_field',
        headers=headers,
        json=custom_field_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['payload']['id']
    assert data == {
        'success': True,
        'payload': {'id': data['payload']['id'], **custom_field_payload, 'options': []},
    }, f'{data=}'

    async def _add_option(opt: dict) -> tuple[str, str]:
        resp_ = test_client.post(
            f'/api/v1/custom_field/{data["payload"]["id"]}/state-option',
            headers=headers,
            json=opt,
        )
        assert resp_.status_code == 200
        data_ = resp_.json()
        assert data_['payload']['id'] == data['payload']['id']
        opts_ = data_['payload'].pop('options')
        assert data_ == {
            'success': True,
            'payload': {'id': data['payload']['id'], **custom_field_payload},
        }, f'{data_=}'
        opt_ = next(filter(lambda x: x['value'] == opt['value'], opts_), None)
        assert opt_, f'{opts_=}'
        assert opt_.get('uuid'), f'{opt_=}'
        assert opt_ == {'uuid': opt_['uuid'], **opt}
        return opt_['uuid'], opt['value']

    option_ids = {}
    for option in options:
        opt_id, opt_val = await _add_option(option)
        option_ids[opt_val] = opt_id
    return {'id': data['payload']['id'], 'options': option_ids}


async def _create_custom_field_version(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    custom_field_payload: dict,
) -> dict:
    custom_field_payload = custom_field_payload.copy()
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    if custom_field_payload['type'] not in ('version', 'version_multi'):
        pytest.xfail('Unsupported custom field type')
    if options := custom_field_payload.get('options', []):
        del custom_field_payload['options']
    response = test_client.post(
        '/api/v1/custom_field',
        headers=headers,
        json=custom_field_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['payload']['id']
    assert data == {
        'success': True,
        'payload': {'id': data['payload']['id'], **custom_field_payload, 'options': []},
    }, f'{data=}'

    async def _add_option(opt: dict) -> tuple[str, str]:
        resp_ = test_client.post(
            f'/api/v1/custom_field/{data["payload"]["id"]}/version-option',
            headers=headers,
            json=opt,
        )
        assert resp_.status_code == 200, f'{resp_=}'
        data_ = resp_.json()
        assert data_['payload']['id'] == data['payload']['id']
        opts_ = data_['payload'].pop('options')
        assert data_ == {
            'success': True,
            'payload': {'id': data['payload']['id'], **custom_field_payload},
        }, f'{data_=}'
        opt_ = next(filter(lambda x: x['value'] == opt['value'], opts_), None)
        assert opt_, f'{opts_=}'
        assert opt_.get('uuid'), f'{opt_=}'
        assert opt_ == {'uuid': opt_['uuid'], **opt}
        return opt_['uuid'], opt['value']

    option_ids = {}
    for option in options:
        opt_id, opt_val = await _add_option(option)
        option_ids[opt_val] = opt_id
    return {'id': data['payload']['id'], 'options': option_ids}


async def _create_custom_field(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    custom_field_payload: dict,
) -> dict:
    if custom_field_payload['type'] in ('enum', 'enum_multi'):
        return await _create_custom_field_enum(
            test_client, create_initial_admin, custom_field_payload
        )
    if custom_field_payload['type'] == 'state':
        return await _create_custom_field_state(
            test_client, create_initial_admin, custom_field_payload
        )
    if custom_field_payload['type'] in ('version', 'version_multi'):
        return await _create_custom_field_version(
            test_client, create_initial_admin, custom_field_payload
        )
    return await _create_custom_field_plain(
        test_client, create_initial_admin, custom_field_payload
    )


@pytest_asyncio.fixture
async def create_custom_field(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    custom_field_payload: dict,
) -> dict:
    return await _create_custom_field(
        test_client, create_initial_admin, custom_field_payload
    )


@pytest_asyncio.fixture
async def create_custom_fields(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    custom_field_payloads: list[dict],
) -> list[dict]:
    res = []
    for custom_field_payload in custom_field_payloads:
        data = await _create_custom_field(
            test_client, create_initial_admin, custom_field_payload
        )
        res.append(data)
    return res

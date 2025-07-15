from typing import TYPE_CHECKING

import pytest
import pytest_asyncio

if TYPE_CHECKING:
    from fastapi.testclient import TestClient


__all__ = (
    'create_custom_field',
    'create_custom_fields',
    'link_custom_field_to_project',
    'unlink_custom_field_from_project',
)

CUSTOM_FIELDS_PLAIN_TYPES = (
    'string',
    'integer',
    'float',
    'boolean',
    'datetime',
    'date',
    'duration',
)


async def __create_custom_field_group(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    custom_field_payload: dict,
    has_options: bool = False,
) -> dict:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.post(
        '/api/v1/custom_field/group',
        headers=headers,
        json=custom_field_payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['payload']['gid']
    assert len(data['payload']['fields']) == 1
    assert data['payload']['fields'][0]['id']
    options_payload = {'options': []} if has_options else {}

    # Normalize default_value for owned multi-field types (empty list becomes None)
    expected_payload = custom_field_payload.copy()
    if (
        expected_payload.get('type') in ('owned_multi',)
        and expected_payload.get('default_value') == []
    ):
        expected_payload['default_value'] = None

    assert data == {
        'success': True,
        'payload': {
            'gid': data['payload']['gid'],
            'name': custom_field_payload['name'],
            'description': custom_field_payload['description'],
            'type': custom_field_payload['type'],
            'ai_description': custom_field_payload['ai_description'],
            'fields': [
                {
                    'id': data['payload']['fields'][0]['id'],
                    'gid': data['payload']['gid'],
                    'label': 'default',
                    **expected_payload,
                    **options_payload,
                    'projects': [],
                },
            ],
        },
    }, f'{data=}'
    return {'id': data['payload']['fields'][0]['id'], 'gid': data['payload']['gid']}


async def _create_custom_field_plain(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    custom_field_payload: dict,
) -> dict:
    if custom_field_payload['type'] not in CUSTOM_FIELDS_PLAIN_TYPES:
        pytest.xfail('Unsupported custom field type')
    return await __create_custom_field_group(
        test_client,
        create_initial_admin,
        custom_field_payload,
    )


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

    field_data = await __create_custom_field_group(
        test_client,
        create_initial_admin,
        custom_field_payload,
        has_options=True,
    )

    async def _add_option(opt: dict) -> tuple[str, str]:
        resp_ = test_client.post(
            f'/api/v1/custom_field/{field_data["id"]}/option',
            headers=headers,
            json=opt,
        )
        assert resp_.status_code == 200
        data_ = resp_.json()
        assert data_['payload']['id'] == field_data['id']
        opts_ = data_['payload'].pop('options')
        assert data_ == {
            'success': True,
            'payload': {
                'id': field_data['id'],
                'gid': field_data['gid'],
                'label': 'default',
                **custom_field_payload,
                'projects': [],
            },
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
    return {**field_data, 'options': option_ids}


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

    field_data = await __create_custom_field_group(
        test_client,
        create_initial_admin,
        custom_field_payload,
        has_options=True,
    )

    async def _add_option(opt: dict) -> tuple[str, str]:
        resp_ = test_client.post(
            f'/api/v1/custom_field/{field_data["id"]}/state-option',
            headers=headers,
            json=opt,
        )
        assert resp_.status_code == 200
        data_ = resp_.json()
        assert data_['payload']['id'] == field_data['id']
        opts_ = data_['payload'].pop('options')
        assert data_ == {
            'success': True,
            'payload': {
                'id': field_data['id'],
                'gid': field_data['gid'],
                'label': 'default',
                **custom_field_payload,
                'projects': [],
            },
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
    return {**field_data, 'options': option_ids}


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

    field_data = await __create_custom_field_group(
        test_client,
        create_initial_admin,
        custom_field_payload,
        has_options=True,
    )

    async def _add_option(opt: dict) -> tuple[str, str]:
        resp_ = test_client.post(
            f'/api/v1/custom_field/{field_data["id"]}/version-option',
            headers=headers,
            json=opt,
        )
        assert resp_.status_code == 200, f'{resp_=}'
        data_ = resp_.json()
        assert data_['payload']['id'] == field_data['id']
        opts_ = data_['payload'].pop('options')
        assert data_ == {
            'success': True,
            'payload': {
                'id': field_data['id'],
                'gid': field_data['gid'],
                'label': 'default',
                **custom_field_payload,
                'projects': [],
            },
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
    return {**field_data, 'options': option_ids}


async def _create_custom_field_owned(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    custom_field_payload: dict,
) -> dict:
    from .create import _create_user

    custom_field_payload = custom_field_payload.copy()
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    if custom_field_payload['type'] not in ('owned', 'owned_multi'):
        pytest.xfail('Unsupported custom field type')
    if options := custom_field_payload.get('options', []):
        del custom_field_payload['options']

    # Create users for options that have owners
    user_mapping = {}
    for opt in options:
        if 'owner' in opt and opt['owner'] is not None:
            owner_data = opt['owner']
            if owner_data['id'] not in user_mapping:
                # Create user payload based on the owner data
                user_payload = {
                    'email': owner_data['email'],
                    'name': owner_data['name'],
                    'is_active': True,
                    'send_email_invite': False,
                    'send_pararam_invite': False,
                }
                # Create the user and store the mapping
                user_id = await _create_user(
                    test_client,
                    create_initial_admin,
                    user_payload,
                )
                user_mapping[owner_data['id']] = user_id

    field_data = await __create_custom_field_group(
        test_client,
        create_initial_admin,
        custom_field_payload,
        has_options=True,
    )

    async def _add_option(opt: dict) -> tuple[str, str]:
        # Convert owner object to just the ID for API request
        opt_payload = opt.copy()
        if 'owner' in opt_payload and opt_payload['owner'] is not None:
            # Map the original test user ID to the actual created user ID
            original_id = opt_payload['owner']['id']
            opt_payload['owner'] = user_mapping[original_id]

        resp_ = test_client.post(
            f'/api/v1/custom_field/{field_data["id"]}/owned-option',
            headers=headers,
            json=opt_payload,
        )
        assert resp_.status_code == 200, f'{resp_=}'
        data_ = resp_.json()
        assert data_['payload']['id'] == field_data['id']
        opts_ = data_['payload'].pop('options')

        # Normalize default_value for owned multi-field types (empty list becomes None)
        expected_payload = custom_field_payload.copy()
        if (
            expected_payload.get('type') in ('owned_multi',)
            and expected_payload.get('default_value') == []
        ):
            expected_payload['default_value'] = None

        assert data_ == {
            'success': True,
            'payload': {
                'id': field_data['id'],
                'gid': field_data['gid'],
                'label': 'default',
                **expected_payload,
                'projects': [],
            },
        }, f'{data_=}'
        opt_ = next(filter(lambda x: x['value'] == opt['value'], opts_), None)
        assert opt_, f'{opts_=}'
        assert opt_.get('uuid'), f'{opt_=}'

        # Build expected option for comparison (handling owner field differences)
        expected_opt = {'uuid': opt_['uuid'], **opt}
        if 'owner' in expected_opt and expected_opt['owner'] is not None:
            # For owned fields, the API returns owner as UserOutput, so we build the expected structure
            original_owner = expected_opt['owner']
            user_id = user_mapping[original_owner['id']]
            # UserOutput format: id, name, email, is_active, avatar (computed)
            expected_opt['owner'] = {
                'id': user_id,
                'name': original_owner['name'],
                'email': original_owner['email'],
                'is_active': True,  # We created users as active
                'avatar': opt_['owner'][
                    'avatar'
                ],  # Use the actual avatar from response
            }

        assert opt_ == expected_opt
        return opt_['uuid'], opt['value'], opt_

    option_ids = {}
    option_data = {}
    for option in options:
        opt_id, opt_val, opt_data = await _add_option(option)
        option_ids[opt_val] = opt_id
        option_data[opt_val] = opt_data

    # Store the actual API response data for owned fields instead of original test data
    return {**field_data, 'options': option_ids, '_option_data': option_data}


async def _create_custom_field(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    custom_field_payload: dict,
) -> dict:
    if custom_field_payload['type'] in ('enum', 'enum_multi'):
        return await _create_custom_field_enum(
            test_client,
            create_initial_admin,
            custom_field_payload,
        )
    if custom_field_payload['type'] == 'state':
        return await _create_custom_field_state(
            test_client,
            create_initial_admin,
            custom_field_payload,
        )
    if custom_field_payload['type'] in ('version', 'version_multi'):
        return await _create_custom_field_version(
            test_client,
            create_initial_admin,
            custom_field_payload,
        )
    if custom_field_payload['type'] in ('owned', 'owned_multi'):
        return await _create_custom_field_owned(
            test_client,
            create_initial_admin,
            custom_field_payload,
        )
    return await _create_custom_field_plain(
        test_client,
        create_initial_admin,
        custom_field_payload,
    )


@pytest_asyncio.fixture
async def create_custom_field(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    custom_field_payload: dict,
) -> dict:
    return await _create_custom_field(
        test_client,
        create_initial_admin,
        custom_field_payload,
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
            test_client,
            create_initial_admin,
            custom_field_payload,
        )
        res.append(data)
    return res


async def link_custom_field_to_project(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    project_id: str,
    custom_field_id: str,
) -> None:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.post(
        f'/api/v1/project/{project_id}/field/{custom_field_id}',
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['id'] == project_id
    assert any(cf['id'] == custom_field_id for cf in data['payload']['custom_fields'])


async def unlink_custom_field_from_project(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    project_id: str,
    custom_field_id: str,
) -> None:
    _, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    response = test_client.delete(
        f'/api/v1/project/{project_id}/field/{custom_field_id}',
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success']
    assert data['payload']['id'] == project_id
    assert all(cf['id'] != custom_field_id for cf in data['payload']['custom_fields'])

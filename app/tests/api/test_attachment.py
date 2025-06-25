from typing import TYPE_CHECKING
from unittest import mock

import mock
import pytest
from fastapi.testclient import TestClient

if TYPE_CHECKING:
    from fastapi.testclient import TestClient

from .create import ALL_PERMISSIONS, _upload_attachment, create_role
from .test_api import (
    create_initial_admin,
    create_project,
)


def _assign_admin_role(
    client: TestClient,
    headers: dict[str, str],
    create_role: str,
    *,
    project_id: str,
    admin_id: str,
) -> None:
    response = client.post(
        f'/api/v1/project/{project_id}/permission',
        headers=headers,
        json={
            'target_type': 'user',
            'target_id': admin_id,
            'role_id': create_role,
        },
    )
    assert response.status_code == 200


@pytest.mark.parametrize(
    'role_payload',
    [
        pytest.param(
            {
                'name': 'Test role',
                'description': 'Test role description',
                'permissions': ALL_PERMISSIONS,
            },
            id='role',
        )
    ],
)
@pytest.mark.parametrize(
    'project_payload',
    [
        pytest.param(
            {
                'name': 'Test project',
                'slug': 'test',
                'description': 'Test project description',
                'ai_description': 'Test project AI description',
            },
            id='project',
        )
    ],
)
@pytest.mark.parametrize(
    'issue_payload',
    [
        pytest.param(
            {
                'subject': 'Issue with files',
                'text': {'value': 'Created via integration-test', 'encryption': None},
            },
            id='issue',
        )
    ],
)
@pytest.mark.asyncio
async def test_issue_attachments_crud(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_role: str,
    create_project,
    issue_payload: dict,
) -> None:
    admin_id, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    project_id = create_project

    _assign_admin_role(
        test_client,
        headers,
        create_role,
        project_id=project_id,
        admin_id=admin_id,
    )

    with (
        mock.patch(
            'pm.api.routes.api.v1.issue.issue.schedule_batched_notification'
        ) as mock_notify,
    ):
        attachment1 = _upload_attachment(
            test_client, headers, filename='attachment1.txt'
        )
        issue_payload['attachments'] = [{'id': attachment1}]
        resp = test_client.post(
            '/api/v1/issue',
            headers=headers,
            json={
                'project_id': project_id,
                'attachments': [{'id': attachment1}],
                **issue_payload,
            },
        )
        assert resp.status_code == 200, resp.text
        issue = resp.json()['payload']
        issue_id = issue['id']
        assert [a['id'] for a in issue['attachments']] == [attachment1]
        mock_notify.assert_called_once()

    resp = test_client.get(f'/api/v1/issue/{issue_id}', headers=headers)
    assert resp.status_code == 200
    issue = resp.json()['payload']
    assert [a['id'] for a in issue['attachments']] == [attachment1]

    with (
        mock.patch(
            'pm.api.routes.api.v1.issue.issue.schedule_batched_notification'
        ) as mock_notify,
    ):
        attachment2 = _upload_attachment(
            test_client, headers, filename='attachment2.txt'
        )
        resp = test_client.put(
            f'/api/v1/issue/{issue_id}',
            headers=headers,
            json={
                'attachments': [
                    {'id': attachment1},
                    {'id': attachment2},
                ],
            },
        )
        assert resp.status_code == 200
        issue = resp.json()['payload']
        assert sorted([a['id'] for a in issue['attachments']]) == sorted(
            [attachment1, attachment2]
        )
        mock_notify.assert_called_once()

    response = test_client.get(
        f'/api/v1/issue/{issue_id}',
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()['payload']['attachments']
    assert len(data) == 2

    with (
        mock.patch(
            'pm.api.routes.api.v1.issue.issue.schedule_batched_notification'
        ) as mock_notify,
    ):
        resp = test_client.put(
            f'/api/v1/issue/{issue_id}',
            headers=headers,
            json={
                'attachments': [{'id': attachment2}],
            },
        )
        assert resp.status_code == 200
        issue = resp.json()['payload']
        assert [a['id'] for a in issue['attachments']] == [attachment2]
        mock_notify.assert_called_once()

    with (
        mock.patch(
            'pm.api.routes.api.v1.issue.issue.schedule_batched_notification'
        ) as mock_notify,
    ):
        resp = test_client.put(
            f'/api/v1/issue/{issue_id}',
            headers=headers,
            json={
                'attachments': [],
            },
        )
        assert resp.status_code == 200
        issue = resp.json()['payload']
        assert issue['attachments'] == []
        mock_notify.assert_called_once()

    response = test_client.get(f'/api/v1/issue/{issue_id}', headers=headers).json()[
        'payload'
    ]
    assert response['attachments'] == []


@pytest.mark.parametrize(
    'role_payload',
    [
        pytest.param(
            {
                'name': 'Test role',
                'description': 'Test role description',
                'permissions': ALL_PERMISSIONS,
            },
            id='role',
        )
    ],
)
@pytest.mark.parametrize(
    'project_payload',
    [
        pytest.param(
            {
                'name': 'Test project',
                'slug': 'test',
                'description': 'Test project description',
                'ai_description': 'Test project AI description',
            },
            id='project',
        )
    ],
)
@pytest.mark.parametrize(
    'issue_payload',
    [
        pytest.param(
            {
                'subject': 'Issue with files',
                'text': {'value': 'Created via integration-test', 'encryption': None},
            },
            id='issue',
        )
    ],
)
@pytest.mark.asyncio
async def test_issue_draft_attachments_crud(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_role: str,
    issue_payload: dict,
    create_project,
):
    admin_id, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    project_id = create_project

    _assign_admin_role(
        test_client,
        headers,
        create_role,
        project_id=project_id,
        admin_id=admin_id,
    )

    draft_attachment1 = _upload_attachment(
        test_client, headers, filename='draft_attachment1.txt'
    )
    issue_payload['attachments'] = [{'id': draft_attachment1}]
    resp = test_client.post(
        '/api/v1/issue/draft',
        headers=headers,
        json={
            'project_id': project_id,
            'attachments': [{'id': draft_attachment1}],
            **issue_payload,
        },
    )
    assert resp.status_code == 200, resp.text
    draft = resp.json()['payload']
    draft_id = draft['id']
    assert [a['id'] for a in draft['attachments']] == [draft_attachment1]

    resp = test_client.get(f'/api/v1/issue/draft/{draft_id}', headers=headers)
    assert resp.status_code == 200
    draft = resp.json()['payload']
    assert [a['id'] for a in draft['attachments']] == [draft_attachment1]

    draft_attachment2 = _upload_attachment(
        test_client, headers, filename='draft_attachment2.txt'
    )
    resp = test_client.put(
        f'/api/v1/issue/draft/{draft_id}',
        headers=headers,
        json={
            'attachments': [
                {'id': draft_attachment1},
                {'id': draft_attachment2},
            ],
        },
    )
    assert resp.status_code == 200
    issue = resp.json()['payload']
    assert sorted([a['id'] for a in issue['attachments']]) == sorted(
        [draft_attachment1, draft_attachment2]
    )

    response = test_client.get(
        f'/api/v1/issue/draft/{draft_id}',
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()['payload']['attachments']
    assert len(data) == 2

    resp = test_client.put(
        f'/api/v1/issue/draft/{draft_id}',
        headers=headers,
        json={
            'attachments': [{'id': draft_attachment2}],
        },
    )
    assert resp.status_code == 200
    issue = resp.json()['payload']
    assert [a['id'] for a in issue['attachments']] == [draft_attachment2]

    resp = test_client.get('/api/v1/issue/draft/list', headers=headers)
    assert resp.status_code == 200
    drafts = resp.json()['payload']['items']
    assert any(d['id'] == draft_id for d in drafts)
    draft_in_list = next(d for d in drafts if d['id'] == draft_id)
    assert [a['id'] for a in draft_in_list['attachments']] == [draft_attachment2]

    resp = test_client.get('/api/v1/issue/draft/select', headers=headers)
    assert resp.status_code == 200
    drafts = resp.json()['payload']['items']
    assert any(d['id'] == draft_id for d in drafts)

    with (
        mock.patch(
            'pm.api.routes.api.v1.issue.issue.schedule_batched_notification'
        ) as mock_notify,
    ):
        resp = test_client.post(
            f'/api/v1/issue/draft/{draft_id}/create',
            headers=headers,
        )
        assert resp.status_code == 200
        issue = resp.json()['payload']
        issue_id = issue['id']
        assert [a['id'] for a in issue['attachments']] == [draft_attachment2]
        mock_notify.assert_called_once()

    resp = test_client.get(f'/api/v1/issue/draft/{draft_id}', headers=headers)
    assert resp.status_code == 404

    resp = test_client.get(f'/api/v1/issue/{issue_id}', headers=headers)
    assert resp.status_code == 200
    issue = resp.json()['payload']
    assert [a['id'] for a in issue['attachments']] == [draft_attachment2]


@pytest.mark.parametrize(
    'role_payload',
    [
        pytest.param(
            {
                'name': 'Test role',
                'description': 'Test role description',
                'permissions': ALL_PERMISSIONS,
            },
            id='role',
        )
    ],
)
@pytest.mark.parametrize(
    'project_payload',
    [
        pytest.param(
            {
                'name': 'Test project',
                'slug': 'test',
                'description': 'Test project description',
                'ai_description': 'Test project AI description',
            },
            id='project',
        )
    ],
)
@pytest.mark.parametrize(
    'issue_payload',
    [
        pytest.param(
            {
                'subject': 'Issue with files',
                'text': {'value': 'Created via integration-test', 'encryption': None},
            },
            id='issue',
        )
    ],
)
@pytest.mark.asyncio
async def test_issue_comment_attachments_crud(
    test_client: 'TestClient',
    create_initial_admin: tuple[str, str],
    create_role: str,
    issue_payload: dict,
    create_project,
):
    admin_id, admin_token = create_initial_admin
    headers = {'Authorization': f'Bearer {admin_token}'}
    project_id = create_project

    _assign_admin_role(
        test_client,
        headers,
        create_role,
        project_id=project_id,
        admin_id=admin_id,
    )

    with mock.patch('pm.api.routes.api.v1.issue.issue.schedule_batched_notification'):
        resp = test_client.post(
            '/api/v1/issue',
            headers=headers,
            json={
                'project_id': project_id,
                **issue_payload,
            },
        )
        assert resp.status_code == 200
        issue_id = resp.json()['payload']['id']

    comment_attachment1 = _upload_attachment(
        test_client, headers, filename='comment_attachment1.txt'
    )
    resp = test_client.post(
        f'/api/v1/issue/{issue_id}/comment',
        headers=headers,
        json={
            'text': {'value': 'Comment with attachment', 'encryption': None},
            'attachments': [{'id': comment_attachment1}],
        },
    )
    assert resp.status_code == 200, resp.text
    comment = resp.json()['payload']
    comment_id = comment['id']
    assert [a['id'] for a in comment['attachments']] == [comment_attachment1]

    resp = test_client.get(
        f'/api/v1/issue/{issue_id}/comment/{comment_id}', headers=headers
    )
    assert resp.status_code == 200
    comment = resp.json()['payload']
    assert [a['id'] for a in comment['attachments']] == [comment_attachment1]

    comment_attachment2 = _upload_attachment(
        test_client, headers, filename='comment_attachment2.txt'
    )
    resp = test_client.put(
        f'/api/v1/issue/{issue_id}/comment/{comment_id}',
        headers=headers,
        json={
            'attachments': [
                {'id': comment_attachment1},
                {'id': comment_attachment2},
            ],
        },
    )
    assert resp.status_code == 200
    comment = resp.json()['payload']
    assert sorted([a['id'] for a in comment['attachments']]) == sorted(
        [comment_attachment1, comment_attachment2]
    )

    resp = test_client.put(
        f'/api/v1/issue/{issue_id}/comment/{comment_id}',
        headers=headers,
        json={
            'attachments': [{'id': comment_attachment2}],
        },
    )
    assert resp.status_code == 200
    comment = resp.json()['payload']
    assert [a['id'] for a in comment['attachments']] == [comment_attachment2]

    resp = test_client.get(f'/api/v1/issue/{issue_id}/comment/list', headers=headers)
    assert resp.status_code == 200
    comments = resp.json()['payload']['items']
    assert any(c['id'] == comment_id for c in comments)
    comment_in_list = next(c for c in comments if c['id'] == comment_id)
    assert [a['id'] for a in comment_in_list['attachments']] == [comment_attachment2]

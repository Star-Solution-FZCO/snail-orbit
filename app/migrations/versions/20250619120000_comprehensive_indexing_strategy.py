from typing import TYPE_CHECKING, ClassVar

import pymongo
from starsol_mongo_migrate import BaseMigration

if TYPE_CHECKING:
    from pymongo.client_session import ClientSession
    from pymongo.database import Database


class Migration(BaseMigration):
    """Comprehensive indexing strategy for performance optimization"""

    revision: ClassVar[str] = '20250619120000'
    down_revision: ClassVar[str | None] = '20250618200450'
    name = 'comprehensive indexing strategy'

    def upgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        issues_collection = db.get_collection('issues')
        issues_collection.create_index(
            [('project.id', 1)], name='project_id_index', session=session
        )
        issues_collection.create_index(
            [('created_at', -1)], name='created_at_index', session=session
        )
        issues_collection.create_index(
            [('updated_at', -1)], name='updated_at_index', session=session
        )
        issues_collection.create_index(
            [('aliases', 1)], name='aliases_index', session=session
        )

        issues_collection.create_index(
            [('project.id', 1), ('created_at', -1)],
            name='project_created_at_index',
            session=session,
        )
        issues_collection.create_index(
            [('project.id', 1), ('updated_at', -1)],
            name='project_updated_at_index',
            session=session,
        )
        issues_collection.create_index(
            [('project.id', 1), ('resolved_at', 1)],
            name='project_resolved_at_index',
            session=session,
        )

        issues_collection.create_index(
            [('fields.gid', 1), ('fields.value', 1)],
            name='fields_gid_value_index',
            session=session,
        )
        issues_collection.create_index(
            [('fields.id', 1)], name='fields_id_index', session=session
        )
        issues_collection.create_index(
            [('fields.name', 1)], name='fields_name_index', session=session
        )

        issues_collection.create_index(
            [('created_by.id', 1)], name='created_by_id_index', session=session
        )
        issues_collection.create_index(
            [('updated_by.id', 1)], name='updated_by_id_index', session=session
        )
        issues_collection.create_index(
            [('subscribers', 1)], name='subscribers_index', session=session
        )

        issues_collection.create_index(
            [('resolved_at', 1)], name='resolved_at_index', session=session
        )
        issues_collection.create_index(
            [('closed_at', 1)], name='closed_at_index', session=session
        )

        issues_collection.create_index(
            [('tags.id', 1)], name='tags_id_index', session=session
        )
        issues_collection.create_index(
            [('tags.name', 1)], name='tags_name_index', session=session
        )
        issues_collection.create_index(
            [('interlinks.issue.id', 1)],
            name='interlinks_issue_id_index',
            session=session,
        )

        issues_collection.create_index(
            [('created_by.id', 1), ('created_at', -1)],
            name='created_by_created_at_index',
            session=session,
        )
        issues_collection.create_index(
            [('subscribers', 1), ('updated_at', -1)],
            name='subscribers_updated_at_index',
            session=session,
        )

        boards_collection = db.get_collection('boards')

        boards_collection.create_index(
            [
                ('permissions.target_type', 1),
                ('permissions.target.id', 1),
                ('permissions.permission_type', 1),
            ],
            name='permissions_compound_index',
            session=session,
        )

        boards_collection.create_index(
            [('projects.id', 1)], name='projects_id_index', session=session
        )
        boards_collection.create_index(
            [('favorite_of', 1)], name='favorite_of_index', session=session
        )

        boards_collection.create_index(
            [('column_field.gid', 1)], name='column_field_gid_index', session=session
        )
        boards_collection.create_index(
            [('swimlane_field.gid', 1)],
            name='swimlane_field_gid_index',
            session=session,
        )
        boards_collection.create_index(
            [('card_fields.gid', 1)], name='card_fields_gid_index', session=session
        )
        boards_collection.create_index(
            [('card_colors_fields.gid', 1)],
            name='card_colors_fields_gid_index',
            session=session,
        )

        boards_collection.create_index(
            [('issues_order', 1)], name='issues_order_index', session=session
        )
        boards_collection.create_index(
            [('created_by.id', 1)], name='created_by_id_index', session=session
        )

        projects_collection = db.get_collection('projects')

        projects_collection.create_index(
            [('permissions.target_type', 1), ('permissions.target.id', 1)],
            name='permissions_target_index',
            session=session,
        )

        projects_collection.create_index(
            [('subscribers', 1)], name='subscribers_index', session=session
        )
        projects_collection.create_index(
            [('custom_fields', 1)], name='custom_fields_index', session=session
        )
        projects_collection.create_index(
            [('slug_history', 1)], name='slug_history_index', session=session
        )
        projects_collection.create_index(
            [('is_active', 1)], name='is_active_index', session=session
        )
        projects_collection.create_index(
            [('workflows', 1)], name='workflows_index', session=session
        )
        projects_collection.create_index(
            [('encryption_settings.users.id', 1)],
            name='encryption_users_index',
            session=session,
        )

        users_collection = db.get_collection('users')

        users_collection.create_index(
            [('groups.id', 1)], name='groups_id_index', session=session
        )

        users_collection.create_index(
            [('api_tokens.is_active', 1)],
            name='api_tokens_active_index',
            session=session,
        )

        users_collection.create_index(
            [('is_active', 1)],
            name='is_active_index',
            partialFilterExpression={'is_active': True},
            session=session,
        )

        users_collection.create_index(
            [('is_admin', 1)], name='is_admin_index', session=session
        )
        users_collection.create_index(
            [('origin', 1)], name='origin_index', session=session
        )
        users_collection.create_index(
            [('mfa_enabled', 1)], name='mfa_enabled_index', session=session
        )

        users_collection.create_index(
            [('name', pymongo.TEXT), ('email', pymongo.TEXT)],
            name='user_text_search_index',
            session=session,
        )

        searches_collection = db.get_collection('searches')

        searches_collection.create_index(
            [
                ('permissions.target_type', 1),
                ('permissions.target.id', 1),
                ('permissions.permission_type', 1),
            ],
            name='permissions_compound_index',
            session=session,
        )
        searches_collection.create_index(
            [('created_by.id', 1)], name='created_by_id_index', session=session
        )

        custom_fields_collection = db.get_collection('custom_fields')

        custom_fields_collection.create_index(
            [('gid', 1)], name='gid_index', session=session
        )
        custom_fields_collection.create_index(
            [('type', 1)], name='type_index', session=session
        )
        custom_fields_collection.create_index(
            [('gid', 1), ('type', 1)], name='gid_type_index', session=session
        )
        custom_fields_collection.create_index(
            [('name', 1)], name='name_index', session=session
        )

        custom_fields_collection.create_index(
            [('name', pymongo.TEXT), ('description', pymongo.TEXT)],
            name='field_text_search_index',
            session=session,
        )

        audits_collection = db.get_collection('audits')

        audits_collection.create_index(
            [('time', -1)], name='time_index', session=session
        )
        audits_collection.create_index(
            [('author.id', 1)], name='author_id_index', session=session
        )

        audits_collection.create_index(
            [('collection', 1), ('object_id', 1), ('time', -1)],
            name='object_audit_history_index',
            session=session,
        )

        audits_collection.create_index(
            [('action', 1)], name='action_index', session=session
        )
        audits_collection.create_index(
            [('revision', 1)], name='revision_index', session=session
        )
        audits_collection.create_index(
            [('next_revision', 1)], name='next_revision_index', session=session
        )

        audits_collection.create_index(
            [('author.id', 1), ('time', -1)], name='author_time_index', session=session
        )

        tags_collection = db.get_collection('tags')

        tags_collection.create_index(
            [('created_by.id', 1)], name='created_by_id_index', session=session
        )
        tags_collection.create_index(
            [('color', 1)], name='color_index', session=session
        )
        tags_collection.create_index(
            [('untag_on_resolve', 1)], name='untag_on_resolve_index', session=session
        )
        tags_collection.create_index(
            [('untag_on_close', 1)], name='untag_on_close_index', session=session
        )

        groups_collection = db.get_collection('groups')

        groups_collection.create_index(
            [('origin', 1)], name='origin_index', session=session
        )
        groups_collection.create_index(
            [('external_id', 1)], name='external_id_index', session=session
        )
        groups_collection.create_index(
            [('predefined_scope', 1)], name='predefined_scope_index', session=session
        )

        workflows_collection = db.get_collection('workflows')

        workflows_collection.create_index(
            [('type', 1)], name='type_index', session=session
        )
        workflows_collection.create_index(
            [('type', 1), ('name', 1)], name='type_name_index', session=session
        )

        roles_collection = db.get_collection('roles')

        roles_collection.create_index(
            [('permissions', 1)], name='permissions_index', session=session
        )

    def downgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        collections_and_indexes = [
            ('roles', ['permissions_index']),
            ('workflows', ['type_index', 'type_name_index']),
            ('groups', ['origin_index', 'external_id_index', 'predefined_scope_index']),
            (
                'tags',
                [
                    'created_by_id_index',
                    'color_index',
                    'untag_on_resolve_index',
                    'untag_on_close_index',
                ],
            ),
            (
                'audits',
                [
                    'time_index',
                    'author_id_index',
                    'object_audit_history_index',
                    'action_index',
                    'revision_index',
                    'next_revision_index',
                    'author_time_index',
                ],
            ),
            (
                'custom_fields',
                [
                    'gid_index',
                    'type_index',
                    'gid_type_index',
                    'name_index',
                    'field_text_search_index',
                ],
            ),
            ('searches', ['permissions_compound_index', 'created_by_id_index']),
            (
                'users',
                [
                    'groups_id_index',
                    'api_tokens_active_index',
                    'is_active_index',
                    'is_admin_index',
                    'origin_index',
                    'mfa_enabled_index',
                    'user_text_search_index',
                ],
            ),
            (
                'projects',
                [
                    'permissions_target_index',
                    'subscribers_index',
                    'custom_fields_index',
                    'slug_history_index',
                    'is_active_index',
                    'workflows_index',
                    'encryption_users_index',
                ],
            ),
            (
                'boards',
                [
                    'permissions_compound_index',
                    'projects_id_index',
                    'favorite_of_index',
                    'column_field_gid_index',
                    'swimlane_field_gid_index',
                    'card_fields_gid_index',
                    'card_colors_fields_gid_index',
                    'issues_order_index',
                    'created_by_id_index',
                ],
            ),
            (
                'issues',
                [
                    'project_id_index',
                    'created_at_index',
                    'updated_at_index',
                    'aliases_index',
                    'project_created_at_index',
                    'project_updated_at_index',
                    'project_resolved_at_index',
                    'fields_gid_value_index',
                    'fields_id_index',
                    'fields_name_index',
                    'created_by_id_index',
                    'updated_by_id_index',
                    'subscribers_index',
                    'resolved_at_index',
                    'closed_at_index',
                    'tags_id_index',
                    'tags_name_index',
                    'interlinks_issue_id_index',
                    'created_by_created_at_index',
                    'subscribers_updated_at_index',
                ],
            ),
        ]

        for collection_name, index_names in collections_and_indexes:
            collection = db.get_collection(collection_name)
            for index_name in index_names:
                try:
                    collection.drop_index(index_name, session=session)
                except pymongo.errors.OperationFailure:
                    pass

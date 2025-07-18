from contextlib import suppress
from typing import TYPE_CHECKING, ClassVar

import pymongo
from starsol_mongo_migrate import BaseMigration

if TYPE_CHECKING:
    from pymongo.client_session import ClientSession
    from pymongo.database import Database


class Migration(BaseMigration):
    """Add per-issue permissions with inheritance control"""

    revision: ClassVar[str] = '20250716000000'
    down_revision: ClassVar[str | None] = '20250619120000'
    name = 'add issue permissions'

    def upgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        issues_collection = db.get_collection('issues')

        # Add permissions field (empty array) to all existing issues
        issues_collection.update_many(
            {},
            {
                '$set': {
                    'permissions': [],
                    'disable_project_permissions_inheritance': False,
                }
            },
            session=session,
        )

        # Create new indexes for permission queries
        issues_collection.create_index(
            [('permissions.target_type', 1), ('permissions.target.id', 1)],
            name='permissions_target_index',
            session=session,
        )

        issues_collection.create_index(
            [('permissions.role.permissions', 1)],
            name='permissions_role_permissions_index',
            session=session,
        )

        issues_collection.create_index(
            [('disable_project_permissions_inheritance', 1)],
            name='inheritance_flag_index',
            session=session,
        )

    def downgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        issues_collection = db.get_collection('issues')

        # Drop the new indexes
        with suppress(pymongo.errors.OperationFailure):
            issues_collection.drop_index('permissions_target_index', session=session)

        with suppress(pymongo.errors.OperationFailure):
            issues_collection.drop_index(
                'permissions_role_permissions_index', session=session
            )

        with suppress(pymongo.errors.OperationFailure):
            issues_collection.drop_index('inheritance_flag_index', session=session)

        # Remove the permissions fields from all issues
        issues_collection.update_many(
            {},
            {
                '$unset': {
                    'permissions': '',
                    'disable_project_permissions_inheritance': '',
                }
            },
            session=session,
        )

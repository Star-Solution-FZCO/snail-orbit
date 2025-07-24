from contextlib import suppress
from typing import TYPE_CHECKING, ClassVar
from uuid import uuid4

import pymongo
from starsol_mongo_migrate import BaseMigration

if TYPE_CHECKING:
    from pymongo.client_session import ClientSession
    from pymongo.database import Database


class Migration(BaseMigration):
    """Add PermissionRecord-based permissions to existing tags"""

    revision: ClassVar[str] = '20250723000000'
    down_revision: ClassVar[str | None] = '20250716000000'
    name = 'add tag permissions'

    def upgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        tags_collection = db.get_collection('tags')

        # Get all existing tags to migrate their creator-based permissions
        existing_tags = list(tags_collection.find({}, session=session))

        for tag in existing_tags:
            # Skip tags that already have permissions (in case migration is re-run)
            if tag.get('permissions'):
                continue

            # Create admin permission for the original creator
            creator_info = tag.get('created_by', {})
            if not creator_info or not creator_info.get('id'):
                continue

            creator_permission = {
                'id': str(uuid4()),  # Generate proper UUID for permission record
                'target_type': 'user',
                'target': creator_info,  # UserLinkField with id, name, email
                'permission_type': 'admin',
            }

            # Add permissions field with creator having admin access
            tags_collection.update_one(
                {'_id': tag['_id']},
                {'$set': {'permissions': [creator_permission]}},
                session=session,
            )

        # Create compound index for efficient permission queries
        tags_collection.create_index(
            [
                ('permissions.target_type', 1),
                ('permissions.target.id', 1),
                ('permissions.permission_type', 1),
            ],
            name='permissions_compound_index',
            session=session,
        )

    def downgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        tags_collection = db.get_collection('tags')

        # Drop the permission compound index
        with suppress(pymongo.errors.OperationFailure):
            tags_collection.drop_index('permissions_compound_index', session=session)

        # Remove the permissions field from all tags
        tags_collection.update_many(
            {},
            {'$unset': {'permissions': ''}},
            session=session,
        )

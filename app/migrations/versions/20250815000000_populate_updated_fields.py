from typing import TYPE_CHECKING, ClassVar

from starsol_mongo_migrate import BaseMigration

if TYPE_CHECKING:
    from pymongo.client_session import ClientSession
    from pymongo.database import Database


class Migration(BaseMigration):
    """Populate empty updated_at and updated_by fields with created_at and created_by values"""

    revision: ClassVar[str] = '20250815000000'
    down_revision: ClassVar[str | None] = '20250814230656'
    name = 'populate updated fields for existing issues'

    def upgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        issues_collection = db.get_collection('issues')

        # Update issues where updated_at is null - set to created_at
        issues_collection.update_many(
            {'updated_at': None},
            [{'$set': {'updated_at': '$created_at'}}],
            session=session,
        )

        # Update issues where updated_by is null - set to created_by
        issues_collection.update_many(
            {'updated_by': None},
            [{'$set': {'updated_by': '$created_by'}}],
            session=session,
        )

    def downgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        issues_collection = db.get_collection('issues')

        # Revert updated_at to null where it equals created_at
        issues_collection.update_many(
            [{'$expr': {'$eq': ['$updated_at', '$created_at']}}],
            {'$set': {'updated_at': None}},
            session=session,
        )

        # Revert updated_by to null where it equals created_by
        issues_collection.update_many(
            [{'$expr': {'$eq': ['$updated_by', '$created_by']}}],
            {'$set': {'updated_by': None}},
            session=session,
        )

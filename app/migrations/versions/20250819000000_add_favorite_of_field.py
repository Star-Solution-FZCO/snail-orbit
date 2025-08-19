import contextlib
from typing import TYPE_CHECKING, ClassVar

from starsol_mongo_migrate import BaseMigration

if TYPE_CHECKING:
    from pymongo.client_session import ClientSession
    from pymongo.database import Database


class Migration(BaseMigration):
    """Add favorite_of field to projects and copy subscribers to it"""

    revision: ClassVar[str] = '20250819000000'
    down_revision: ClassVar[str | None] = '20250815000000'
    name = 'add favorite_of field to projects'

    def upgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        projects_collection = db.get_collection('projects')

        # Add favorite_of field to all projects, copying subscribers values
        projects_collection.update_many(
            {},
            [{'$set': {'favorite_of': '$subscribers'}}],
            session=session,
        )

        # Create index for favorite_of field
        projects_collection.create_index([('favorite_of', 1)], name='favorite_of_index')

    def downgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        projects_collection = db.get_collection('projects')

        # Drop index for favorite_of field
        with contextlib.suppress(Exception):
            projects_collection.drop_index('favorite_of_index')

        # Remove favorite_of field from all projects
        projects_collection.update_many(
            {},
            {'$unset': {'favorite_of': ''}},
            session=session,
        )

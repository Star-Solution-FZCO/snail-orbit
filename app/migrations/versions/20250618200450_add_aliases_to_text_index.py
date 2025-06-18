from typing import TYPE_CHECKING, ClassVar

import pymongo
from starsol_mongo_migrate import BaseMigration

if TYPE_CHECKING:
    from pymongo.client_session import ClientSession
    from pymongo.database import Database


class Migration(BaseMigration):
    """Add aliases field to the text index for combined text and alias search"""

    revision: ClassVar[str] = '20250618200450'
    down_revision: ClassVar[str | None] = '20250617180000'
    name = 'add aliases to text index'

    def upgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        issues_collection = db.get_collection('issues')

        # Drop the old text index
        try:
            issues_collection.drop_index('text_index', session=session)
        except pymongo.errors.OperationFailure:
            # Index might not exist, continue
            pass

        # Create new text index that includes aliases
        issues_collection.create_index(
            [
                ('subject', pymongo.TEXT),
                ('text', pymongo.TEXT),
                ('aliases', pymongo.TEXT),
                ('attachments.ocr_text', pymongo.TEXT),
                ('comments.text', pymongo.TEXT),
            ],
            name='text_index',
            session=session,
        )

    def downgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        issues_collection = db.get_collection('issues')

        # Drop the new text index
        try:
            issues_collection.drop_index('text_index', session=session)
        except pymongo.errors.OperationFailure:
            # Index might not exist, continue
            pass

        # Recreate old text index without aliases
        issues_collection.create_index(
            [
                ('subject', pymongo.TEXT),
                ('text', pymongo.TEXT),
                ('attachments.ocr_text', pymongo.TEXT),
                ('comments.text', pymongo.TEXT),
            ],
            name='text_index',
            session=session,
        )

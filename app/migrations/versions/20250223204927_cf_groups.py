from typing import TYPE_CHECKING, ClassVar
from uuid import uuid4

from starsol_mongo_migrate import BaseMigration

if TYPE_CHECKING:
    from pymongo.client_session import ClientSession
    from pymongo.database import Database


class Migration(BaseMigration):
    """
    Adds a global identifier (gid) and a default label to each custom field in the custom_fields collection.

    During the upgrade, it assigns a unique global identifier (gid) and a default label to each custom field
    and propagates these updates to related fields in other collections.
    """

    revision: ClassVar[str] = '20250223204927'
    down_revision: ClassVar[str | None] = None
    name = 'cf_groups'

    def upgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        # Write your migration below using the session object
        for cf in db.get_collection('custom_fields').find().to_list():
            gid = str(uuid4())
            db.get_collection('custom_fields').update_one(
                {'_id': cf['_id']},
                {'$set': {'label': 'default', 'gid': gid}},
                session=session,
            )
            db.get_collection('issues').update_many(
                {'fields.id': cf['_id']},
                {'$set': {'fields.$[f].gid': gid}},
                array_filters=[{'f.id': cf['_id']}],
                session=session,
            )
            db.get_collection('issues').update_many(
                {'history.changes.field.id': cf['_id']},
                {
                    '$set': {
                        'history.$[].changes.$[c].field.gid': gid,
                    }
                },
                array_filters=[{'c.field.id': cf['_id']}],
                session=session,
            )
            db.get_collection('issue_drafts').update_many(
                {'fields.id': cf['_id']},
                {'$set': {'fields.$[f].gid': gid}},
                array_filters=[{'f.id': cf['_id']}],
                session=session,
            )
            db.get_collection('boards').update_many(
                {'column_field.id': cf['_id']},
                {'$set': {'column_field.gid': gid}},
            )
            db.get_collection('boards').update_many(
                {'swimlane_field.id': cf['_id']},
                {'$set': {'swimlane_field.gid': gid}},
            )
            db.get_collection('boards').update_many(
                {'card_fields.id': cf['_id']},
                {'$set': {'card_fields.$[f].gid': gid}},
                array_filters=[{'f.id': cf['_id']}],
            )
            db.get_collection('boards').update_many(
                {'card_colors_fields.id': cf['_id']},
                {'$set': {'card_colors_fields.$[f].gid': gid}},
                array_filters=[{'f.id': cf['_id']}],
            )

    def downgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        # Write your migration rollback below using the session object
        db.get_collection('boards').update_many(
            {},
            {'$unset': {'card_colors_fields.$[].gid': ''}},
            session=session,
        )
        db.get_collection('boards').update_many(
            {},
            {'$unset': {'card_fields.$[].gid': ''}},
            session=session,
        )
        db.get_collection('boards').update_many(
            {},
            {'$unset': {'column_field.gid': '', 'swimlane_field.gid': ''}},
            session=session,
        )
        db.get_collection('issue_drafts').update_many(
            {},
            {'$unset': {'fields.$[].gid': ''}},
            session=session,
        )
        db.get_collection('issues').update_many(
            {},
            {'$unset': {'history.$[].changes.$[].field.gid': ''}},
            session=session,
        )
        db.get_collection('issues').update_many(
            {},
            {'$unset': {'fields.$[].gid': ''}},
            session=session,
        )
        db.get_collection('custom_fields').update_many(
            {}, {'$unset': {'label': '', 'gid': ''}}, session=session
        )

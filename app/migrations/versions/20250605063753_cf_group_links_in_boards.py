from typing import TYPE_CHECKING, ClassVar

from starsol_mongo_migrate import BaseMigration

if TYPE_CHECKING:
    from pymongo.client_session import ClientSession
    from pymongo.database import Database


class Migration(BaseMigration):
    """use cf group links in boards"""

    revision: ClassVar[str] = '20250605063753'
    down_revision: ClassVar[str | None] = '20250430041628'
    name = 'use cf group links in boards'

    def upgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        boards_collection = db.get_collection('boards')

        boards_collection.update_many(
            {'column_field': {'$exists': True}},
            {'$unset': {'column_field.id': ''}},
            session=session,
        )

        boards_collection.update_many(
            {'swimlane_field': {'$exists': True}},
            {'$unset': {'swimlane_field.id': ''}},
            session=session,
        )

        boards_collection.update_many(
            {'card_fields': {'$exists': True}},
            {'$unset': {'card_fields.$[].id': ''}},
            session=session,
        )

        boards_collection.update_many(
            {'card_colors_fields': {'$exists': True}},
            {'$unset': {'card_colors_fields.$[].id': ''}},
            session=session,
        )

    def downgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        boards_collection = db.get_collection('boards')
        custom_fields_collection = db.get_collection('custom_fields')

        gid_to_id_map = {}
        for cf in custom_fields_collection.find({}, {'_id': 1, 'gid': 1}):
            gid_to_id_map[cf['gid']] = cf['_id']

        for board in boards_collection.find({}):
            updates = {}

            if 'column_field' in board and 'gid' in board['column_field']:
                updates['column_field.id'] = gid_to_id_map.get(
                    board['column_field']['gid']
                )

            if (
                'swimlane_field' in board
                and board['swimlane_field']
                and 'gid' in board['swimlane_field']
            ):
                updates['swimlane_field.id'] = gid_to_id_map.get(
                    board['swimlane_field']['gid']
                )

            if 'card_fields' in board and board['card_fields']:
                for i, field in enumerate(board['card_fields']):
                    if 'gid' in field:
                        updates[f'card_fields.{i}.id'] = gid_to_id_map.get(field['gid'])

            if 'card_colors_fields' in board and board['card_colors_fields']:
                for i, field in enumerate(board['card_colors_fields']):
                    if 'gid' in field:
                        updates[f'card_colors_fields.{i}.id'] = gid_to_id_map.get(
                            field['gid']
                        )

            if updates:
                boards_collection.update_one(
                    {'_id': board['_id']}, {'$set': updates}, session=session
                )

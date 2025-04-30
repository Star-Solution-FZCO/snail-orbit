from collections.abc import Mapping
from datetime import datetime
from typing import TYPE_CHECKING, Any, ClassVar, Literal

from bson import ObjectId
from starsol_mongo_migrate import BaseMigration

if TYPE_CHECKING:
    from pymongo.client_session import ClientSession
    from pymongo.database import Database


def _get_latest_field_change(
    issue: Mapping[str, Any],
    field_ids: set[ObjectId],
) -> datetime | None:
    for record in sorted(
        issue.get('history', []), key=lambda h: h['time'], reverse=True
    ):
        for change in record.get('changes', []):
            field_id = change.get('field', {}).get('id', None)
            if field_id and field_id in field_ids:
                return record['time']
    return None


def _get_states_fields(
    issue: Mapping[str, Any],
    status: Literal['is_resolved', 'is_closed'],
) -> set[ObjectId] | None:
    state_fields = set()
    for field in issue.get('fields', []):
        if field['type'] != 'state':
            continue
        if field['value'] and field['value'][status]:
            state_fields.add(field['id'])
            continue
        return None
    return state_fields


class Migration(BaseMigration):
    """Save calculated resolved_at and closed_at info in the issues collection"""

    revision: ClassVar[str] = '20250430041628'
    down_revision: ClassVar[str | None] = '20250223215034'
    name = 'save_states'

    def upgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        for issue in db.get_collection('issues').find(
            {'resolved_at': {'$exists': False}}
        ):
            field_ids = _get_states_fields(issue, 'is_resolved')
            if not field_ids:
                resolved_at = None
            else:
                resolved_at = (
                    _get_latest_field_change(issue, field_ids) or issue['created_at']
                )
            db.get_collection('issues').update_one(
                {'_id': issue['_id']}, {'$set': {'resolved_at': resolved_at}}
            )
        for issue in db.get_collection('issues').find(
            {'closed_at': {'$exists': False}}
        ):
            field_ids = _get_states_fields(issue, 'is_closed')
            if not field_ids:
                closed_at = None
            else:
                closed_at = (
                    _get_latest_field_change(issue, field_ids) or issue['created_at']
                )
            db.get_collection('issues').update_one(
                {'_id': issue['_id']}, {'$set': {'closed_at': closed_at}}
            )

        for issue in db.get_collection('issues').find():
            db.get_collection('issues').update_many(
                {'interlinks': {'$elemMatch': {'issue.id': issue['_id']}}},
                {
                    '$set': {
                        'interlinks.$[i].issue.is_resolved': bool(
                            issue.get('resolved_at')
                        ),
                        'interlinks.$[i].issue.is_closed': bool(issue.get('closed_at')),
                    },
                },
                array_filters=[{'i.issue.id': issue['_id']}],
            )

    def downgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        db.get_collection('issues').update_many(
            {},
            {
                '$unset': {
                    'interlinks.$[].issue.is_resolved': '',
                    'interlinks.$[].issue.is_closed': '',
                }
            },
        )
        db.get_collection('issues').update_many(
            {}, {'$unset': {'resolved_at': '', 'closed_at': ''}}
        )

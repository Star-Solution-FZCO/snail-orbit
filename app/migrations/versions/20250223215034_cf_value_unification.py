from typing import TYPE_CHECKING, ClassVar

from starsol_mongo_migrate import BaseMigration

if TYPE_CHECKING:
    from pymongo.client_session import ClientSession
    from pymongo.database import Database


class Migration(BaseMigration):
    """cf_value_unification"""

    revision: ClassVar[str] = '20250223215034'
    down_revision: ClassVar[str | None] = '20250223204927'
    name = 'cf_value_unification'

    def upgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        # Write your migration below using the session object
        for cf in db.get_collection('custom_fields').find({'type': 'state'}).to_list():
            if cf.get('default_value'):
                db.get_collection('custom_fields').update_one(
                    {'_id': cf['_id']},
                    {
                        '$set': {'default_value.value': cf['default_value']['state']},
                        '$unset': {'default_value.state': ''},
                    },
                    session=session,
                )
            for opt in cf.get('options', []):
                db.get_collection('custom_fields').update_one(
                    {'_id': cf['_id']},
                    {
                        '$set': {'options.$[o].value': opt['state']},
                        '$unset': {'options.$[o].state': ''},
                    },
                    array_filters=[{'o.id': opt['id']}],
                    session=session,
                )
                db.get_collection('issues').update_many(
                    {
                        'fields': {
                            '$elemMatch': {'id': cf['_id'], 'value.id': opt['id']}
                        }
                    },
                    {
                        '$set': {'fields.$[f].value.value': opt['state']},
                        '$unset': {'fields.$[f].value.state': ''},
                    },
                    array_filters=[{'f.id': cf['_id'], 'f.value.id': opt['id']}],
                    session=session,
                )
                db.get_collection('issues').update_many(
                    {'history.changes.field.id': cf['_id']},
                    {
                        '$set': {
                            'history.$[].changes.$[c].old_value.value': opt['state']
                        },
                        '$unset': {'history.$[].changes.$[c].old_value.state': ''},
                    },
                    array_filters=[
                        {'c.field.id': cf['_id'], 'c.old_value.id': opt['id']}
                    ],
                    session=session,
                )
                db.get_collection('issues').update_many(
                    {'history.changes.field.id': cf['_id']},
                    {
                        '$set': {
                            'history.$[].changes.$[c].new_value.value': opt['state']
                        },
                        '$unset': {'history.$[].changes.$[c].new_value.state': ''},
                    },
                    array_filters=[
                        {'c.field.id': cf['_id'], 'c.new_value.id': opt['id']}
                    ],
                    session=session,
                )
                db.get_collection('issue_drafts').update_many(
                    {
                        'fields': {
                            '$elemMatch': {'id': cf['_id'], 'value.id': opt['id']}
                        }
                    },
                    {
                        '$set': {'fields.$[f].value.value': opt['state']},
                        '$unset': {'fields.$[f].value.state': ''},
                    },
                    array_filters=[{'f.id': cf['_id'], 'f.value.id': opt['id']}],
                    session=session,
                )
                db.get_collection('boards').update_many(
                    {'column_field.id': cf['_id']},
                    {
                        '$set': {'columns.$[c].value': opt['state']},
                        '$unset': {'columns.$[c].state': ''},
                    },
                    array_filters=[{'c.id': opt['id']}],
                    session=session,
                )
                db.get_collection('boards').update_many(
                    {'swimlane_field.id': cf['_id']},
                    {
                        '$set': {'swimlanes.$[c].value': opt['state']},
                        '$unset': {'swimlanes.$[c].state': ''},
                    },
                    array_filters=[{'c.id': opt['id']}],
                    session=session,
                )
        for cf in (
            db.get_collection('custom_fields').find({'type': 'version'}).to_list()
        ):
            if cf.get('default_value'):
                db.get_collection('custom_fields').update_one(
                    {'_id': cf['_id']},
                    {
                        '$set': {'default_value.value': cf['default_value']['version']},
                        '$unset': {'default_value.version': ''},
                    },
                    session=session,
                )
            for opt in cf.get('options', []):
                db.get_collection('custom_fields').update_one(
                    {'_id': cf['_id']},
                    {
                        '$set': {'options.$[o].value': opt['version']},
                        '$unset': {'options.$[o].version': ''},
                    },
                    array_filters=[{'o.id': opt['id']}],
                    session=session,
                )
                db.get_collection('issues').update_many(
                    {
                        'fields': {
                            '$elemMatch': {'id': cf['_id'], 'value.id': opt['id']}
                        }
                    },
                    {
                        '$set': {'fields.$[f].value.value': opt['version']},
                        '$unset': {'fields.$[f].value.version': ''},
                    },
                    array_filters=[{'f.id': cf['_id'], 'f.value.id': opt['id']}],
                    session=session,
                )
                db.get_collection('issues').update_many(
                    {'history.changes.field.id': cf['_id']},
                    {
                        '$set': {
                            'history.$[].changes.$[c].old_value.value': opt['version']
                        },
                        '$unset': {'history.$[].changes.$[c].old_value.version': ''},
                    },
                    array_filters=[
                        {'c.field.id': cf['_id'], 'c.old_value.id': opt['id']}
                    ],
                    session=session,
                )
                db.get_collection('issues').update_many(
                    {'history.changes.field.id': cf['_id']},
                    {
                        '$set': {
                            'history.$[].changes.$[c].new_value.value': opt['version']
                        },
                        '$unset': {'history.$[].changes.$[c].new_value.version': ''},
                    },
                    array_filters=[
                        {'c.field.id': cf['_id'], 'c.new_value.id': opt['id']}
                    ],
                    session=session,
                )
                db.get_collection('issue_drafts').update_many(
                    {
                        'fields': {
                            '$elemMatch': {'id': cf['_id'], 'value.id': opt['id']}
                        }
                    },
                    {
                        '$set': {'fields.$[f].value.value': opt['version']},
                        '$unset': {'fields.$[f].value.version': ''},
                    },
                    array_filters=[{'f.id': cf['_id'], 'f.value.id': opt['id']}],
                    session=session,
                )
                db.get_collection('boards').update_many(
                    {'column_field.id': cf['_id']},
                    {
                        '$set': {'columns.$[c].value': opt['version']},
                        '$unset': {'columns.$[c].version': ''},
                    },
                    array_filters=[{'c.id': opt['id']}],
                    session=session,
                )
                db.get_collection('boards').update_many(
                    {'swimlane_field.id': cf['_id']},
                    {
                        '$set': {'swimlanes.$[c].value': opt['version']},
                        '$unset': {'swimlanes.$[c].version': ''},
                    },
                    array_filters=[{'c.id': opt['id']}],
                    session=session,
                )
        for cf in (
            db.get_collection('custom_fields').find({'type': 'version_multi'}).to_list()
        ):
            for default_opt in cf.get('default_value', []):
                db.get_collection('custom_fields').update_one(
                    {'_id': cf['_id']},
                    {
                        '$set': {'default_value.$[o].value': default_opt['version']},
                        '$unset': {'default_value.$[o].version': ''},
                    },
                    array_filters=[{'o.id': default_opt['id']}],
                    session=session,
                )
            for opt in cf.get('options', []):
                db.get_collection('custom_fields').update_one(
                    {'_id': cf['_id']},
                    {
                        '$set': {'options.$[o].value': opt['version']},
                        '$unset': {'options.$[o].version': ''},
                    },
                    array_filters=[{'o.id': opt['id']}],
                    session=session,
                )
                db.get_collection('issues').update_many(
                    {
                        'fields': {
                            '$elemMatch': {'id': cf['_id'], 'value.id': opt['id']}
                        }
                    },
                    {
                        '$set': {'fields.$[f].value.$[val].value': opt['version']},
                        '$unset': {'fields.$[f].value.$[val].version': ''},
                    },
                    array_filters=[{'f.id': cf['_id']}, {'val.id': opt['id']}],
                    session=session,
                )
                db.get_collection('issues').update_many(
                    {'history.changes.field.id': cf['_id']},
                    {
                        '$set': {
                            'history.$[].changes.$[c].old_value.$[val].value': opt[
                                'version'
                            ]
                        },
                        '$unset': {
                            'history.$[].changes.$[c].old_value.$[val].version': ''
                        },
                    },
                    array_filters=[{'c.field.id': cf['_id'], 'val.id': opt['id']}],
                    session=session,
                )
                db.get_collection('issues').update_many(
                    {'history.changes.field.id': cf['_id']},
                    {
                        '$set': {
                            'history.$[].changes.$[c].new_value.$[val].value': opt[
                                'version'
                            ]
                        },
                        '$unset': {
                            'history.$[].changes.$[c].new_value.$[val].version': ''
                        },
                    },
                    array_filters=[{'c.field.id': cf['_id'], 'val.id': opt['id']}],
                    session=session,
                )
                db.get_collection('issue_drafts').update_many(
                    {
                        'fields': {
                            '$elemMatch': {'id': cf['_id'], 'value.id': opt['id']}
                        }
                    },
                    {
                        '$set': {'fields.$[f].value.$[val].value': opt['version']},
                        '$unset': {'fields.$[f].value.$[val].version': ''},
                    },
                    array_filters=[{'f.id': cf['_id']}, {'val.id': opt['id']}],
                    session=session,
                )
                db.get_collection('boards').update_many(
                    {'column_field.id': cf['_id']},
                    {
                        '$set': {'columns.$[c].value': opt['version']},
                        '$unset': {'columns.$[c].version': ''},
                    },
                    array_filters=[{'c.id': opt['id']}],
                    session=session,
                )
                db.get_collection('boards').update_many(
                    {'swimlane_field.id': cf['_id']},
                    {
                        '$set': {'swimlanes.$[c].value': opt['version']},
                        '$unset': {'swimlanes.$[c].version': ''},
                    },
                    array_filters=[{'c.id': opt['id']}],
                    session=session,
                )

    def downgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        # Write your migration rollback below using the session object
        for cf in (
            db.get_collection('custom_fields').find({'type': 'version_multi'}).to_list()
        ):
            for default_opt in cf.get('default_value', []):
                db.get_collection('custom_fields').update_one(
                    {'_id': cf['_id']},
                    {
                        '$set': {'default_value.$[o].version': default_opt['value']},
                        '$unset': {'default_value.$[o].value': ''},
                    },
                    array_filters=[{'o.id': default_opt['id']}],
                    session=session,
                )
            for opt in cf.get('options', []):
                db.get_collection('custom_fields').update_one(
                    {'_id': cf['_id']},
                    {
                        '$set': {'options.$[o].version': opt['value']},
                        '$unset': {'options.$[o].value': ''},
                    },
                    array_filters=[{'o.id': opt['id']}],
                    session=session,
                )
                db.get_collection('issues').update_many(
                    {
                        'fields': {
                            '$elemMatch': {'id': cf['_id'], 'value.id': opt['id']}
                        }
                    },
                    {
                        '$set': {'fields.$[f].value.$[val].version': opt['value']},
                        '$unset': {'fields.$[f].value.$[val].value': ''},
                    },
                    array_filters=[{'f.id': cf['_id']}, {'val.id': opt['id']}],
                    session=session,
                )
                db.get_collection('issues').update_many(
                    {'history.changes.field.id': cf['_id']},
                    {
                        '$set': {
                            'history.$[].changes.$[c].old_value.$[val].version': opt[
                                'value'
                            ]
                        },
                        '$unset': {
                            'history.$[].changes.$[c].old_value.$[val].value': ''
                        },
                    },
                    array_filters=[{'c.field.id': cf['_id'], 'val.id': opt['id']}],
                    session=session,
                )
                db.get_collection('issues').update_many(
                    {'history.changes.field.id': cf['_id']},
                    {
                        '$set': {
                            'history.$[].changes.$[c].new_value.$[val].version': opt[
                                'value'
                            ]
                        },
                        '$unset': {
                            'history.$[].changes.$[c].new_value.$[val].value': ''
                        },
                    },
                    array_filters=[{'c.field.id': cf['_id'], 'val.id': opt['id']}],
                    session=session,
                )
                db.get_collection('issue_drafts').update_many(
                    {
                        'fields': {
                            '$elemMatch': {'id': cf['_id'], 'value.id': opt['id']}
                        }
                    },
                    {
                        '$set': {'fields.$[f].value.$[val].version': opt['value']},
                        '$unset': {'fields.$[f].value.$[val].value': ''},
                    },
                    array_filters=[{'f.id': cf['_id']}, {'val.id': opt['id']}],
                    session=session,
                )
                db.get_collection('boards').update_many(
                    {'column_field.id': cf['_id']},
                    {
                        '$set': {'columns.$[c].state': opt['version']},
                        '$unset': {'columns.$[c].version': ''},
                    },
                    array_filters=[{'c.id': opt['id']}],
                    session=session,
                )
                db.get_collection('boards').update_many(
                    {'swimlane_field.id': cf['_id']},
                    {
                        '$set': {'swimlanes.$[c].version': opt['value']},
                        '$unset': {'swimlanes.$[c].value': ''},
                    },
                    array_filters=[{'c.id': opt['id']}],
                    session=session,
                )
        for cf in (
            db.get_collection('custom_fields').find({'type': 'version'}).to_list()
        ):
            if cf.get('default_value'):
                db.get_collection('custom_fields').update_one(
                    {'_id': cf['_id']},
                    {
                        '$set': {'default_value.version': cf['default_value']['value']},
                        '$unset': {'default_value.value': ''},
                    },
                    session=session,
                )
            for opt in cf.get('options', []):
                db.get_collection('custom_fields').update_one(
                    {'_id': cf['_id']},
                    {
                        '$set': {'options.$[o].version': opt['value']},
                        '$unset': {'options.$[o].value': ''},
                    },
                    array_filters=[{'o.id': opt['id']}],
                    session=session,
                )
                db.get_collection('issues').update_many(
                    {
                        'fields': {
                            '$elemMatch': {'id': cf['_id'], 'value.id': opt['id']}
                        }
                    },
                    {
                        '$set': {'fields.$[f].value.version': opt['value']},
                        '$unset': {'fields.$[f].value.value': ''},
                    },
                    array_filters=[{'f.id': cf['_id'], 'f.value.id': opt['id']}],
                    session=session,
                )
                db.get_collection('issues').update_many(
                    {'history.changes.field.id': cf['_id']},
                    {
                        '$set': {
                            'history.$[].changes.$[c].old_value.version': opt['value']
                        },
                        '$unset': {'history.$[].changes.$[c].old_value.value': ''},
                    },
                    array_filters=[
                        {'c.field.id': cf['_id'], 'c.old_value.id': opt['id']}
                    ],
                    session=session,
                )
                db.get_collection('issues').update_many(
                    {'history.changes.field.id': cf['_id']},
                    {
                        '$set': {
                            'history.$[].changes.$[c].new_value.version': opt['value']
                        },
                        '$unset': {'history.$[].changes.$[c].new_value.value': ''},
                    },
                    array_filters=[
                        {'c.field.id': cf['_id'], 'c.new_value.id': opt['id']}
                    ],
                    session=session,
                )
                db.get_collection('issue_drafts').update_many(
                    {
                        'fields': {
                            '$elemMatch': {'id': cf['_id'], 'value.id': opt['id']}
                        }
                    },
                    {
                        '$set': {'fields.$[f].value.version': opt['value']},
                        '$unset': {'fields.$[f].value.value': ''},
                    },
                    array_filters=[{'f.id': cf['_id'], 'f.value.id': opt['id']}],
                    session=session,
                )
                db.get_collection('boards').update_many(
                    {'column_field.id': cf['_id']},
                    {
                        '$set': {'columns.$[c].state': opt['version']},
                        '$unset': {'columns.$[c].version': ''},
                    },
                    array_filters=[{'c.id': opt['id']}],
                    session=session,
                )
                db.get_collection('boards').update_many(
                    {'swimlane_field.id': cf['_id']},
                    {
                        '$set': {'swimlanes.$[c].version': opt['value']},
                        '$unset': {'swimlanes.$[c].value': ''},
                    },
                    array_filters=[{'c.id': opt['id']}],
                    session=session,
                )
        for cf in db.get_collection('custom_fields').find({'type': 'state'}).to_list():
            if cf.get('default_value'):
                db.get_collection('custom_fields').update_one(
                    {'_id': cf['_id']},
                    {
                        '$set': {'default_value.state': cf['default_value']['value']},
                        '$unset': {'default_value.value': ''},
                    },
                    session=session,
                )
            for opt in cf.get('options', []):
                db.get_collection('custom_fields').update_one(
                    {'_id': cf['_id']},
                    {
                        '$set': {'options.$[o].state': opt['value']},
                        '$unset': {'options.$[o].value': ''},
                    },
                    array_filters=[{'o.id': opt['id']}],
                    session=session,
                )
                db.get_collection('issues').update_many(
                    {
                        'fields': {
                            '$elemMatch': {'id': cf['_id'], 'value.id': opt['id']}
                        }
                    },
                    {
                        '$set': {'fields.$[f].value.state': opt['value']},
                        '$unset': {'fields.$[f].value.value': ''},
                    },
                    array_filters=[{'f.id': cf['_id'], 'f.value.id': opt['id']}],
                    session=session,
                )
                db.get_collection('issues').update_many(
                    {'history.changes.field.id': cf['_id']},
                    {
                        '$set': {
                            'history.$[].changes.$[c].old_value.state': opt['value']
                        },
                        '$unset': {'history.$[].changes.$[c].old_value.value': ''},
                    },
                    array_filters=[
                        {'c.field.id': cf['_id'], 'c.old_value.id': opt['id']}
                    ],
                    session=session,
                )
                db.get_collection('issues').update_many(
                    {'history.changes.field.id': cf['_id']},
                    {
                        '$set': {
                            'history.$[].changes.$[c].new_value.state': opt['value']
                        },
                        '$unset': {'history.$[].changes.$[c].new_value.value': ''},
                    },
                    array_filters=[
                        {'c.field.id': cf['_id'], 'c.new_value.id': opt['id']}
                    ],
                    session=session,
                )
                db.get_collection('issue_drafts').update_many(
                    {
                        'fields': {
                            '$elemMatch': {'id': cf['_id'], 'value.id': opt['id']}
                        }
                    },
                    {
                        '$set': {'fields.$[f].value.state': opt['value']},
                        '$unset': {'fields.$[f].value.value': ''},
                    },
                    array_filters=[{'f.id': cf['_id'], 'f.value.id': opt['id']}],
                    session=session,
                )
                db.get_collection('boards').update_many(
                    {'column_field.id': cf['_id']},
                    {
                        '$set': {'columns.$[c].state': opt['value']},
                        '$unset': {'columns.$[c].value': ''},
                    },
                    array_filters=[{'c.id': opt['id']}],
                    session=session,
                )
                db.get_collection('boards').update_many(
                    {'swimlane_field.id': cf['_id']},
                    {
                        '$set': {'swimlanes.$[c].state': opt['value']},
                        '$unset': {'swimlanes.$[c].value': ''},
                    },
                    array_filters=[{'c.id': opt['id']}],
                    session=session,
                )

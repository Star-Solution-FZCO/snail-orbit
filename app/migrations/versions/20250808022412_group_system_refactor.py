from contextlib import suppress
from typing import TYPE_CHECKING, ClassVar

import pymongo
from starsol_mongo_migrate import BaseMigration

if TYPE_CHECKING:
    from pymongo.client_session import ClientSession
    from pymongo.database import Database


class Migration(BaseMigration):
    """Refactor group system to Beanie inheritance with polymorphic types"""

    revision: ClassVar[str] = '20250808022412'
    down_revision: ClassVar[str | None] = '20250723000000'
    name = 'group_system_refactor'

    def upgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        groups_collection = db.get_collection('groups')
        custom_fields_collection = db.get_collection('custom_fields')

        # Step 1: Transform existing groups to new inheritance model
        existing_groups = list(groups_collection.find({}, session=session))

        for group in existing_groups:
            updates = {}
            unset_fields = {}

            # Determine group type and set Beanie discriminator
            if group.get('predefined_scope') == 'all_users':
                updates.update(
                    {'_class_id': 'Group.AllUsersGroup', 'type': 'all_users'}
                )
            elif group.get('origin') == 'wb':
                updates.update({'_class_id': 'Group.WBGroup', 'type': 'wb'})
                # Move external_id to wb_id for WB groups
                if group.get('external_id'):
                    updates['wb_id'] = int(group['external_id'])
            else:  # LOCAL or default
                updates.update({'_class_id': 'Group.LocalGroup', 'type': 'local'})
            unset_fields.update(
                {
                    'origin': '',
                    'predefined_scope': '',
                    'external_id': '',
                }
            )
            # Apply the transformation
            update_operations = {}
            if updates:
                update_operations['$set'] = updates
            if unset_fields:
                update_operations['$unset'] = unset_fields

            if update_operations:
                groups_collection.update_one(
                    {'_id': group['_id']}, update_operations, session=session
                )

        # Step 2: Clean up custom field GroupOptions - remove embedded users arrays
        custom_fields_collection.update_many(
            {'options.type': 'group', 'options.value.users': {'$exists': True}},
            {'$unset': {'options.$[opt].value.users': ''}},
            array_filters=[{'opt.type': 'group', 'opt.value.users': {'$exists': True}}],
            session=session,
        )

        # Step 3: Update embedded GroupLinkField documents across all collections

        # 3a: Update PermissionRecordMixin collections (permissions.target)
        permission_collections = ['boards', 'searches', 'reports', 'tags']
        for collection_name in permission_collections:
            collection = db.get_collection(collection_name)

            # Update embedded GroupLinkField in permissions.target
            for group in existing_groups:
                group_id = group['_id']
                new_type = (
                    'all_users'
                    if group.get('predefined_scope') == 'all_users'
                    else ('wb' if group.get('origin') == 'wb' else 'local')
                )

                # Update all documents where permissions.target.id matches this group
                collection.update_many(
                    {
                        'permissions.target_type': 'group',
                        'permissions.target.id': group_id,
                    },
                    {
                        '$set': {'permissions.$[perm].target.type': new_type},
                        '$unset': {'permissions.$[perm].target.predefined_scope': ''},
                    },
                    array_filters=[
                        {'perm.target_type': 'group', 'perm.target.id': group_id}
                    ],
                    session=session,
                )

        # 3b: Update users collection (groups field)
        users_collection = db.get_collection('users')
        for group in existing_groups:
            group_id = group['_id']
            new_type = (
                'all_users'
                if group.get('predefined_scope') == 'all_users'
                else ('wb' if group.get('origin') == 'wb' else 'local')
            )

            users_collection.update_many(
                {'groups.id': group_id},
                {
                    '$set': {'groups.$[g].type': new_type},
                    '$unset': {'groups.$[g].predefined_scope': ''},
                },
                array_filters=[{'g.id': group_id}],
                session=session,
            )

        # 3c: Update custom_fields collection (user custom field group options)
        for group in existing_groups:
            group_id = group['_id']
            new_type = (
                'all_users'
                if group.get('predefined_scope') == 'all_users'
                else ('wb' if group.get('origin') == 'wb' else 'local')
            )

            custom_fields_collection.update_many(
                {'options.type': 'group', 'options.value.group.id': group_id},
                {
                    '$set': {'options.$[opt].value.group.type': new_type},
                    '$unset': {'options.$[opt].value.group.predefined_scope': ''},
                },
                array_filters=[{'opt.type': 'group', 'opt.value.group.id': group_id}],
                session=session,
            )

        # 3d: Update projects collection (ProjectPermission.target)
        projects_collection = db.get_collection('projects')
        for group in existing_groups:
            group_id = group['_id']
            new_type = (
                'all_users'
                if group.get('predefined_scope') == 'all_users'
                else ('wb' if group.get('origin') == 'wb' else 'local')
            )

            projects_collection.update_many(
                {'permissions.target_type': 'group', 'permissions.target.id': group_id},
                {
                    '$set': {'permissions.$[perm].target.type': new_type},
                    '$unset': {'permissions.$[perm].target.predefined_scope': ''},
                },
                array_filters=[
                    {'perm.target_type': 'group', 'perm.target.id': group_id}
                ],
                session=session,
            )

        # 3e: Update issues collection (ProjectPermission.target)
        issues_collection = db.get_collection('issues')
        for group in existing_groups:
            group_id = group['_id']
            new_type = (
                'all_users'
                if group.get('predefined_scope') == 'all_users'
                else ('wb' if group.get('origin') == 'wb' else 'local')
            )

            issues_collection.update_many(
                {'permissions.target_type': 'group', 'permissions.target.id': group_id},
                {
                    '$set': {'permissions.$[perm].target.type': new_type},
                    '$unset': {'permissions.$[perm].target.predefined_scope': ''},
                },
                array_filters=[
                    {'perm.target_type': 'group', 'perm.target.id': group_id}
                ],
                session=session,
            )

        # Step 4: Update indexes
        # Drop old indexes if they exist
        old_indexes = ['origin_index', 'external_id_index', 'predefined_scope_index']
        for index_name in old_indexes:
            with suppress(pymongo.errors.OperationFailure):
                groups_collection.drop_index(index_name, session=session)

        # Create new type index
        groups_collection.create_index(
            [('type', 1)],
            name='type_index',
            session=session,
        )

    def downgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        raise NotImplementedError()

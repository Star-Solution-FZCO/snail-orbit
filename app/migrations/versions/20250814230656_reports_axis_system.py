from contextlib import suppress
from typing import TYPE_CHECKING, ClassVar

from starsol_mongo_migrate import BaseMigration

if TYPE_CHECKING:
    from pymongo.client_session import ClientSession
    from pymongo.database import Database


class Migration(BaseMigration):
    """Convert reports from type-based system to axis-based system with CustomFieldGroupLink"""

    revision: ClassVar[str] = '20250814230656'
    down_revision: ClassVar[str | None] = '20250808022412'
    name = 'reports_axis_system'

    def upgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        reports_collection = db.get_collection('reports')

        # Get all existing reports
        existing_reports = list(reports_collection.find({}, session=session))

        for report in existing_reports:
            updates = {}
            unset_fields = {'type': '', '_class_id': ''}

            report_type = report.get('type')

            if report_type == 'issues_per_project':
                # Convert to project axis
                updates['axis_1'] = {'type': 'project', 'custom_field': None}
            elif report_type == 'issues_per_field':
                # Convert to custom field axis using CustomFieldGroupLink format
                field = report.get('field', {})
                if field:
                    # Convert CustomFieldLink to CustomFieldGroupLink format
                    custom_field_group_link = {
                        'gid': field.get('gid'),
                        'name': field.get('name'),
                        'type': field.get('type'),
                    }
                    updates['axis_1'] = {
                        'type': 'custom_field',
                        'custom_field': custom_field_group_link,
                    }
                # Remove the old field reference
                unset_fields['field'] = ''
            elif report_type == 'issues_per_two_fields':
                # Convert to two-axis system using CustomFieldGroupLink format
                row_field = report.get('row_field', {})
                column_field = report.get('column_field', {})

                if row_field:
                    # Convert CustomFieldLink to CustomFieldGroupLink format
                    row_field_group_link = {
                        'gid': row_field.get('gid'),
                        'name': row_field.get('name'),
                        'type': row_field.get('type'),
                    }
                    updates['axis_1'] = {
                        'type': 'custom_field',
                        'custom_field': row_field_group_link,
                    }

                if column_field:
                    # Convert CustomFieldLink to CustomFieldGroupLink format
                    column_field_group_link = {
                        'gid': column_field.get('gid'),
                        'name': column_field.get('name'),
                        'type': column_field.get('type'),
                    }
                    updates['axis_2'] = {
                        'type': 'custom_field',
                        'custom_field': column_field_group_link,
                    }

                # Remove the old field references
                unset_fields.update({'row_field': '', 'column_field': ''})

            # Apply the transformation
            update_operations = {}
            if updates:
                update_operations['$set'] = updates
            if unset_fields:
                update_operations['$unset'] = unset_fields

            if update_operations:
                reports_collection.update_one(
                    {'_id': report['_id']}, update_operations, session=session
                )

        # Update indexes - remove type_index and add axis_1_type_index
        with suppress(Exception):
            reports_collection.drop_index('type_index', session=session)

    def downgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        raise NotImplementedError()

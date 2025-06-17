from typing import TYPE_CHECKING, ClassVar

from starsol_mongo_migrate import BaseMigration

if TYPE_CHECKING:
    from pymongo.client_session import ClientSession
    from pymongo.database import Database


class Migration(BaseMigration):
    """Convert board issues_order from list of ObjectIds to list of relationship tuples"""

    revision: ClassVar[str] = '20250617180000'
    down_revision: ClassVar[str | None] = '20250605063753'
    name = 'convert board issues_order to relationship tuples'

    def upgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        boards_collection = db.get_collection('boards')

        # Find all boards with existing issues_order as list of ObjectIds
        for board in boards_collection.find(
            {'issues_order': {'$exists': True}}, session=session
        ):
            issues_order = board.get('issues_order', [])

            # Skip if already converted (contains tuples) or empty
            if not issues_order or (issues_order and isinstance(issues_order[0], list)):
                continue

            # Convert list of ObjectIds to list of relationship tuples
            # First issue goes to first position (None), others come after previous issue
            relationships = []
            if len(issues_order) > 0:
                # First issue goes to first position
                relationships.append([issues_order[0], None])
                # Subsequent issues come after the previous one
                for i in range(1, len(issues_order)):
                    current_issue = issues_order[i]
                    previous_issue = issues_order[i - 1]
                    relationships.append([current_issue, previous_issue])

            # Update the board with the new relationship-based structure
            boards_collection.update_one(
                {'_id': board['_id']},
                {'$set': {'issues_order': relationships}},
                session=session,
            )

    def downgrade(self, session: 'ClientSession | None', db: 'Database') -> None:
        boards_collection = db.get_collection('boards')

        # Find all boards with relationship-based issues_order
        for board in boards_collection.find(
            {'issues_order': {'$exists': True}}, session=session
        ):
            issues_order = board.get('issues_order', [])

            # Skip if already in old format (list of ObjectIds) or empty
            if not issues_order or (
                issues_order and not isinstance(issues_order[0], list)
            ):
                continue

            # Convert relationship tuples back to ordered list
            ordered_issues = []

            # Build a dependency graph
            comes_after = {}  # issue_id -> after_issue_id
            all_issues = set()
            first_position_issues = []

            for rel in issues_order:
                issue_id, after_issue_id = rel
                all_issues.add(issue_id)
                if after_issue_id is None:
                    first_position_issues.append(issue_id)
                else:
                    comes_after[issue_id] = after_issue_id
                    all_issues.add(after_issue_id)

            # Build the ordered list by following the chain
            visited = set()

            def add_issue_and_dependencies(issue_id):
                if issue_id in visited or issue_id is None:
                    return
                visited.add(issue_id)
                ordered_issues.append(issue_id)

                # Find issues that come after this one
                for dependent_id, after_id in comes_after.items():
                    if after_id == issue_id and dependent_id not in visited:
                        add_issue_and_dependencies(dependent_id)

            # Start with first position issues
            for first_issue in first_position_issues:
                add_issue_and_dependencies(first_issue)

            # Then handle any remaining chains (issues that don't come after None)
            roots = all_issues - set(comes_after.keys()) - set(first_position_issues)
            for root in roots:
                add_issue_and_dependencies(root)

            # Add any remaining issues that weren't connected
            for issue_id in all_issues - visited:
                if issue_id is not None:
                    ordered_issues.append(issue_id)

            # Update the board with the old list-based structure
            boards_collection.update_one(
                {'_id': board['_id']},
                {'$set': {'issues_order': ordered_issues}},
                session=session,
            )

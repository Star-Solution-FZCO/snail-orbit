# pylint: disable=import-outside-toplevel
import argparse
from pathlib import Path

from starsol_mongo_migrate import MigrationManager

__all__ = ('add_db_args',)


def get_migration_manager() -> MigrationManager:
    """Create and return MigrationManager instance with project configuration."""
    from pm.config import CONFIG

    migrations_dir = Path(__file__).parent.parent.parent / 'migrations' / 'versions'
    return MigrationManager(
        mongo_uri=CONFIG.DB_URI,
        migrations_dir=migrations_dir,
    )


def init_migrations(_args: argparse.Namespace) -> None:
    """Initialize migration system."""
    with get_migration_manager() as manager:
        manager.init()
        print('Migration system initialized')


def create_migration(args: argparse.Namespace) -> None:
    """Create a new migration file."""
    with get_migration_manager() as manager:
        revision = manager.generate(args.name)
        print(f'Created migration: {revision}_{args.name}.py')


def migrate_up(args: argparse.Namespace) -> None:
    """Apply migrations (upgrade to latest or specific revision)."""
    with get_migration_manager() as manager:
        current_before = manager.current_revision()
        print(f'Current revision: {current_before or "None"}')

        if args.revision:
            manager.upgrade(
                target_revision=args.revision,
                use_transactions=args.use_transactions,
            )
            print(f'Upgraded to revision: {args.revision}')
        else:
            manager.upgrade(use_transactions=args.use_transactions)
            print('Upgraded to latest revision')

        current_after = manager.current_revision()
        print(f'New revision: {current_after}')


def migrate_down(args: argparse.Namespace) -> None:
    """Rollback migrations (downgrade to specific revision or root)."""
    with get_migration_manager() as manager:
        current_before = manager.current_revision()
        print(f'Current revision: {current_before or "None"}')

        if args.revision:
            manager.downgrade(
                target_revision=args.revision,
                use_transactions=args.use_transactions,
            )
            print(f'Downgraded to revision: {args.revision}')
        else:
            manager.downgrade(use_transactions=args.use_transactions)
            print('Downgraded to root')

        current_after = manager.current_revision()
        print(f'New revision: {current_after or "None"}')


def migration_status(_args: argparse.Namespace) -> None:
    """Show current migration status and list all migrations."""
    with get_migration_manager() as manager:
        current = manager.current_revision()
        print(f'Current revision: {current or "None"}')
        print()

        migrations = manager.list_migrations()
        if not migrations:
            print('No migrations found')
            return

        print('Available migrations:')
        for revision, name in migrations:
            status = '✓' if revision == current else ' '
            print(f'  {status} {revision}: {name}')


def add_db_args(parser: argparse.ArgumentParser) -> None:
    """Add database migration subcommands to parser."""
    subparsers = parser.add_subparsers(required=True)

    # db migrate init
    init_parser = subparsers.add_parser('init', help='Initialize migration system')
    init_parser.set_defaults(func=init_migrations)

    # db migrate create
    create_parser = subparsers.add_parser('create', help='Create new migration')
    create_parser.add_argument('name', help='Migration name')
    create_parser.set_defaults(func=create_migration)

    # db migrate up
    up_parser = subparsers.add_parser('up', help='Apply migrations (upgrade)')
    up_parser.add_argument('--revision', help='Target revision (default: latest)')
    up_parser.add_argument(
        '--use-transactions',
        dest='use_transactions',
        action='store_true',
        default=False,
        help='Enable MongoDB transactions (requires replica set or sharded cluster, disabled by default)',
    )
    up_parser.set_defaults(func=migrate_up)

    # db migrate down
    down_parser = subparsers.add_parser('down', help='Rollback migrations (downgrade)')
    down_parser.add_argument('--revision', help='Target revision (default: root)')
    down_parser.add_argument(
        '--use-transactions',
        dest='use_transactions',
        action='store_true',
        default=False,
        help='Enable MongoDB transactions (requires replica set or sharded cluster, disabled by default)',
    )
    down_parser.set_defaults(func=migrate_down)

    # db migrate status
    status_parser = subparsers.add_parser('status', help='Show migration status')
    status_parser.set_defaults(func=migration_status)

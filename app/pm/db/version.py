import logging
from pathlib import Path

from starsol_mongo_migrate import MigrationManager

from pm.config import CONFIG

__all__ = (
    'DatabaseVersionMismatchError',
    'check_database_version',
)

logger = logging.getLogger(__name__)


class DatabaseVersionMismatchError(Exception):
    """Raised when database version doesn't match expected version."""


def check_database_version() -> None:
    """Check if database version matches expected version and auto-migrate or raise exception."""
    migrations_dir = Path(__file__).parent.parent.parent / 'migrations' / 'versions'
    manager = MigrationManager(
        mongo_uri=CONFIG.DB_URI,
        migrations_dir=migrations_dir,
    )

    with manager:
        current_revision = manager.current_revision()
        available_migrations = manager.list_migrations()

        if not available_migrations:
            logger.info('No database migrations found, skipping version check')
            return

        latest_revision = available_migrations[-1][0]

        if current_revision == latest_revision:
            logger.info('Database version check passed: revision %s', current_revision)
            return

        current_str = current_revision or 'None'
        logger.warning(
            'Database version mismatch: current=%s, expected=%s',
            current_str,
            latest_revision,
        )

        # Try auto-migration for upgrades only
        is_behind = current_revision is None or current_revision < latest_revision
        if CONFIG.DB_AUTO_MIGRATE and is_behind:
            logger.info('Auto-migration enabled, upgrading database to latest version')
            try:
                manager.upgrade(use_transactions=False)
                new_revision = manager.current_revision()
                logger.info(
                    'Database successfully migrated from %s to %s',
                    current_str,
                    new_revision,
                )
                return
            except Exception as e:
                logger.exception('Auto-migration failed')
                raise DatabaseVersionMismatchError(
                    f'Auto-migration failed from {current_str} to {latest_revision}. '
                    f'Error: {e}. Try running migrations manually: python3 manage.py db up',
                ) from e

        # Build error message for manual intervention
        if is_behind:
            status = (
                'has not been migrated yet'
                if current_revision is None
                else 'is behind expected version'
            )
            cmd = 'python3 manage.py db up'
        else:
            status = 'is ahead of expected version (auto-downgrade not supported)'
            cmd = f'python3 manage.py db down --revision {latest_revision}'

        auto_migrate_hint = (
            ' (DB_AUTO_MIGRATE is enabled but only supports upgrades)'
            if CONFIG.DB_AUTO_MIGRATE
            else ' (Set DB_AUTO_MIGRATE=true to enable automatic upgrades)'
            if is_behind
            else ''
        )

        error_msg = f'Database {status}. Current: {current_str}, Expected: {latest_revision}. Run: {cmd}{auto_migrate_hint}'
        raise DatabaseVersionMismatchError(error_msg)

import argparse
import typing
from argparse import ArgumentParser
from os.path import dirname, realpath
from os.path import join as opj
from pathlib import Path

if typing.TYPE_CHECKING:
    from alembic.config import Config

__all__ = ('add_db_args',)


def _alembic_default_parser(parser: argparse.ArgumentParser) -> None:
    root_dir = realpath(opj(dirname(realpath(__file__)), '../../'))
    parser.add_argument(
        '--migration-dir', type=Path, default=Path(root_dir, 'migrations')
    )
    parser.add_argument(
        '--config-file', type=Path, default=Path(root_dir, 'migrations/alembic.ini')
    )


def _alembic_config(args: argparse.Namespace) -> 'Config':
    from alembic.config import Config

    config = Config(file_=args.config_file)
    config.set_main_option('script_location', str(args.migration_dir))
    return config


def db_migrate(args: argparse.Namespace) -> None:
    from alembic import command

    command.revision(
        _alembic_config(args), args.message, args.autogenerate, args.sql, args.head
    )


def db_upgrade(args: argparse.Namespace) -> None:
    from alembic import command

    command.upgrade(_alembic_config(args), args.rev_id or 'head')


def db_downgrade(args: argparse.Namespace) -> None:
    from alembic import command

    command.downgrade(_alembic_config(args), args.rev_id or 'head')


def db_history(args: argparse.Namespace) -> None:
    from alembic import command

    command.history(_alembic_config(args))


def add_db_args(subparser: ArgumentParser) -> None:
    db_subparsers = subparser.add_subparsers(required=True)
    db_migrate_parser = db_subparsers.add_parser('migrate')
    db_migrate_parser.add_argument('message', type=str)
    db_migrate_parser.add_argument('--autogenerate', action='store_true')
    db_migrate_parser.add_argument('--sql', action='store_true')
    db_migrate_parser.add_argument('--head', type=str, default='head')
    _alembic_default_parser(db_migrate_parser)
    db_migrate_parser.set_defaults(func=db_migrate)
    db_upgrade_parser = db_subparsers.add_parser('upgrade')
    db_upgrade_parser.add_argument('--rev-id', type=str, default='head')
    _alembic_default_parser(db_upgrade_parser)
    db_upgrade_parser.set_defaults(func=db_upgrade)
    db_downgrade_parser = db_subparsers.add_parser('downgrade')
    db_downgrade_parser.add_argument('--rev-id', type=str, default='head')
    _alembic_default_parser(db_downgrade_parser)
    db_downgrade_parser.set_defaults(func=db_downgrade)
    db_history_parser = db_subparsers.add_parser('history')
    _alembic_default_parser(db_history_parser)
    db_history_parser.set_defaults(func=db_history)

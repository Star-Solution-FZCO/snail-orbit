import argparse
import asyncio
import sys

from pm.cli.api import add_api_args
from pm.cli.db import add_db_args
from pm.cli.encryption import add_encryption_args
from pm.cli.tasks import add_tasks_args
from pm.cli.user import add_user_args
from pm.cli.workflow import add_workflow_args


def execute(args: argparse.Namespace) -> None:
    if asyncio.iscoroutinefunction(args.func):
        asyncio.run(args.func(args))
    else:
        args.func(args)


def main() -> int:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(required=True)
    add_api_args(subparsers.add_parser('api', help='API server commands'))
    add_db_args(subparsers.add_parser('db', help='Database migration commands'))
    add_encryption_args(
        subparsers.add_parser('encryption', help='Encryption key generation commands')
    )
    add_user_args(subparsers.add_parser('user', help='User commands'))
    add_workflow_args(subparsers.add_parser('workflow', help='Workflow commands'))
    add_tasks_args(subparsers.add_parser('tasks', help='Celery tasks commands'))
    args = parser.parse_args()
    execute(args)
    return 0


if __name__ == '__main__':
    sys.exit(main())

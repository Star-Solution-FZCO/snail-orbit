import argparse
import asyncio
import sys

from pm.cli.api import add_api_args
from pm.cli.user import add_user_args


def execute(args: argparse.Namespace) -> None:
    if asyncio.iscoroutinefunction(args.func):
        asyncio.run(args.func(args))
    else:
        args.func(args)


def main() -> int:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(required=True)
    add_api_args(subparsers.add_parser('api', help='API server commands'))
    add_user_args(subparsers.add_parser('user', help='User commands'))
    args = parser.parse_args()
    execute(args)
    return 0


if __name__ == '__main__':
    sys.exit(main())

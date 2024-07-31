import argparse
import sys

from pm.cli.api import add_api_args


def main() -> int:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(required=True)
    add_api_args(subparsers.add_parser('api', help='API server commands'))
    args = parser.parse_args()
    args.func(args)
    return 0


if __name__ == '__main__':
    sys.exit(main())

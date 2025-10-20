#!/usr/bin/env python3
import argparse
import re
import subprocess
import sys
from enum import StrEnum


VersionT = tuple[int, int, int, int | None]
FIRST_VERSION: VersionT = (0, 1, 0, 1)
VERSION_PATTERN = re.compile(r'^(\d+)\.(\d+)\.(\d+)(?:-rc\.(\d+))?$')


class CmdException(ValueError):
    pass


class VersionType(StrEnum):
    MAJOR = 'major'
    MINOR = 'minor'
    PATCH = 'patch'


def git(*args) -> bytes:
    return subprocess.check_output(['git'] + list(args))


def parse_version(tag: str) -> VersionT | None:
    """Parse version tag into components: (major, minor, patch, rc_number)"""
    if match := VERSION_PATTERN.match(tag):
        major, minor, patch, rc = match.groups()
        return int(major), int(minor), int(patch), int(rc) if rc else None
    return None


def format_version(version: VersionT) -> str:
    """Format version components into tag string"""
    major, minor, patch, rc = version
    base_version = f'{major}.{minor}.{patch}'
    if rc is not None:
        return f'{base_version}-rc.{rc}'
    return base_version


def version_sort_key(version: VersionT) -> tuple[int, int, int, float]:
    major, minor, patch, rc = version
    return major, minor, patch, rc if rc is not None else float('inf')


def parse_tags(tags: list[str]) -> list[VersionT]:
    """Parse list of tags into version components"""
    versions_ = [parse_version(tag) for tag in tags]
    versions: list[VersionT] = [v for v in versions_ if v]
    versions.sort(key=version_sort_key, reverse=True)
    return versions


def get_latest_version() -> VersionT | None:
    """Get the latest version (including RC) as (major, minor, patch, rc_number)"""
    tags = git('tag', '-l').decode().strip().split('\n')
    versions = parse_tags(tags)
    return next((v for v in versions), None)


def head_version() -> VersionT | None:
    """Get version tag at current HEAD"""
    tags = git('tag', '--points-at', 'HEAD').decode().strip().split('\n')
    versions = parse_tags(tags)
    return next((v for v in versions), None)


def get_new_bump_version(
    latest_version: VersionT | None, version_update_type: VersionType | None
) -> VersionT:
    """Get new version for bump command"""
    if not latest_version:
        return FIRST_VERSION

    major, minor, patch, rc = latest_version

    if not version_update_type:
        if rc:
            return major, minor, patch, rc + 1
        return major, minor, patch + 1, 1
    if rc:
        raise CmdException(
            'Cannot use --type when on RC version. Use promote or no arguments.'
        )
    if version_update_type == VersionType.MAJOR:
        return major + 1, 0, 0, 1
    if version_update_type == VersionType.MINOR:
        return major, minor + 1, 0, 1
    if version_update_type == VersionType.PATCH:
        return major, minor, patch + 1, 1
    raise CmdException(f'Unknown version update type: {version_update_type}')


def handle_bump(args) -> int:
    """Handle bump subcommand"""
    if not args.no_fetch:
        print('Fetching tags from remote')
        git('fetch', '--tags', 'origin')

    version_type = getattr(args, 'type', None)

    if head_vers := head_version():
        print(f'Already on tagged version: {head_vers}')
        return 1

    latest_version = get_latest_version()
    try:
        new_version = get_new_bump_version(latest_version, version_type)
    except CmdException as e:
        print(f'Error: {e}')
        return 1

    latest_version_str = format_version(latest_version) if latest_version else None
    new_version_str = format_version(new_version)

    print(f'Bumping version: {latest_version_str} -> {new_version_str}')

    if args.dry_run:
        print('Dry run, not tagging or pushing')
        return 0

    git('tag', new_version_str)
    if args.push:
        print('Pushing tag to origin')
        git('push', 'origin', new_version_str)
    return 0


def handle_promote(args) -> int:
    """Handle promote subcommand"""
    if not args.no_fetch:
        print('Fetching tags from remote')
        git('fetch', '--tags', 'origin')

    head_vers = head_version()
    if not head_vers:
        print('Not on a tagged version')
        return 1

    major, minor, patch, rc = head_vers
    if not rc:
        print(f'Current version {format_version(head_vers)} is not an RC')
        return 1

    new_version_str = format_version((major, minor, patch, None))

    print(f'Promoting version: {head_vers} -> {new_version_str}')

    if args.dry_run:
        print('Dry run, not tagging or pushing')
        return 0

    git('tag', new_version_str)
    if args.push:
        print('Pushing tag to origin')
        git('push', 'origin', new_version_str)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description='Version management with RC support')

    # Add subparsers (required, no default)
    subparsers = parser.add_subparsers(dest='command', help='Commands', required=True)

    # Bump subparser
    bump_parser = subparsers.add_parser(
        'bump', help='Create new RC version or increment existing RC'
    )
    bump_parser.add_argument(
        '-t',
        '--type',
        type=str,
        choices=list(VersionType),
        help='Version type to create RC for (major, minor, patch). Smart patch RC if not specified.',
    )
    bump_parser.add_argument(
        '--no-fetch', action='store_true', help='do not fetch tags from remote'
    )
    bump_parser.add_argument(
        '--push', action='store_true', help='push new tag to remote'
    )
    bump_parser.add_argument(
        '--dry-run',
        action='store_true',
        help='show what would be done without making changes',
    )
    bump_parser.set_defaults(func=handle_bump)

    # Promote subparser
    promote_parser = subparsers.add_parser(
        'promote', help='Promote current RC version to final release'
    )
    promote_parser.add_argument(
        '--no-fetch', action='store_true', help='do not fetch tags from remote'
    )
    promote_parser.add_argument(
        '--push', action='store_true', help='push new tag to remote'
    )
    promote_parser.add_argument(
        '--dry-run',
        action='store_true',
        help='show what would be done without making changes',
    )
    promote_parser.set_defaults(func=handle_promote)

    args = parser.parse_args()
    return args.func(args)


if __name__ == '__main__':
    sys.exit(main())

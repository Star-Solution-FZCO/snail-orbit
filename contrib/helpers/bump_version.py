#!/usr/bin/env python3
import argparse
import re
import subprocess
import sys
from enum import StrEnum

FIRST_VERSION = '0.1.0'
VERSION_PATTERN = re.compile(r'^(\d+)\.(\d+)\.(\d+)$')


class VersionType(StrEnum):
    MAJOR = 'major'
    MINOR = 'minor'
    PATCH = 'patch'


def git(*args) -> bytes:
    return subprocess.check_output(['git'] + list(args))


def get_latest_version() -> tuple[int, int, int] | None:
    tags = git('tag', '-l', '--sort=-v:refname').decode().strip().split('\n')
    for tag in tags:
        if match := VERSION_PATTERN.match(tag):
            major, minor, patch = match.groups()
            return int(major), int(minor), int(patch)
    return None


def head_version() -> str | None:
    tags = git('tag', '--points-at', 'HEAD').decode().strip().split('\n')
    return next((tag for tag in tags if VERSION_PATTERN.match(tag)), None)


def get_new_version(version_update_type: VersionType) -> tuple[str | None, str | None]:
    if head_vers := head_version():
        return None, head_vers
    latest_version = get_latest_version()
    if not latest_version:
        return FIRST_VERSION, None
    major, minor, patch = latest_version
    latest_version_str = f'{major}.{minor}.{patch}'
    if version_update_type == VersionType.MAJOR:
        return f'{major + 1}.0.0', latest_version_str
    if version_update_type == VersionType.MINOR:
        return f'{major}.{minor + 1}.0', latest_version_str
    if version_update_type == VersionType.PATCH:
        return f'{major}.{minor}.{patch + 1}', latest_version_str
    raise ValueError(f'Unknown version update type: {version_update_type}')


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '-t',
        '--type',
        type=str,
        choices=list(VersionType),
        default=VersionType.PATCH,
        help='version type to bump (major, minor, patch), default: patch',
    )
    parser.add_argument('--no-fetch', action='store_true', help='do not fetch tags from remote')
    parser.add_argument('--push', action='store_true', help='push new tag to remote')
    parser.add_argument('--dry-run', action='store_true', help='do not tag or push')
    args = parser.parse_args()

    if not args.no_fetch:
        print('Fetching tags from remote')
        git('fetch', '--tags', 'origin')

    new_version, latest_version = get_new_version(args.type)
    if not new_version:
        print(f'Already on the latest version: {latest_version}')
        return 1
    print(f'Bumping version: {latest_version} -> {new_version}')
    if args.dry_run:
        print('Dry run, not tagging or pushing')
        return 0
    git('tag', new_version)
    if args.push:
        print('Pushing tag to origin')
        git('push', 'origin', new_version)
    return 0


if __name__ == '__main__':
    sys.exit(main())

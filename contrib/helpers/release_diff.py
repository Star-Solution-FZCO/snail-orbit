#!/usr/bin/env python3
"""
Helper script to show commits in master that are not in release branch.
Compares commits by Change-Id field in commit messages.
"""

import subprocess
import sys
import re


class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    CYAN = '\033[0;36m'
    MAGENTA = '\033[0;35m'
    NC = '\033[0m'  # No Color


def run_git_command(cmd: list[str]) -> str:
    """Run a git command and return the output."""
    try:
        result = subprocess.run(
            ['git'] + cmd, capture_output=True, text=True, check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(
            f'{Colors.RED}Error running git command: {" ".join(["git"] + cmd)}{Colors.NC}'
        )
        print(f'Error: {e.stderr}')
        sys.exit(1)


def extract_change_id(commit_message: str) -> str | None:
    """Extract Change-Id from commit message."""
    match = re.search(r'Change-Id:\s*(\S+)', commit_message)
    return match.group(1) if match else None


def get_last_merge_commit() -> tuple[str, str]:
    """Find the last merge commit from master to release."""
    print(f'{Colors.YELLOW}Finding last merge from master to release...{Colors.NC}')

    # Get all merge commits on release branch
    merge_commits_output = run_git_command(
        ['log', 'release', '--merges', '--format=%H', '-20']
    )

    if not merge_commits_output:
        print(f'{Colors.RED}Error: No merge commits found on release branch{Colors.NC}')
        sys.exit(1)

    merge_commits = merge_commits_output.split('\n')

    # Check each merge commit to see if it's a merge from master
    for merge_commit in merge_commits:
        # Get the parents of this merge commit
        parents = run_git_command(['log', '-1', '--format=%P', merge_commit]).split()

        if len(parents) >= 2:
            # Check if the second parent (merged branch) is reachable from master
            try:
                # Check if the second parent is in master's history
                run_git_command(['merge-base', '--is-ancestor', parents[1], 'master'])

                # This is a merge from master, get the merge info
                merge_oneline = run_git_command(
                    ['log', '-1', '--oneline', merge_commit]
                )
                print(f'Last merge: {merge_oneline}')

                # The second parent is the last commit that was merged from master
                last_merged_commit = parents[1]
                print(f'Last merged commit from master: {last_merged_commit}')

                return merge_oneline, last_merged_commit

            except subprocess.CalledProcessError:
                # This merge is not from master, continue searching
                continue

    print(
        f'{Colors.RED}Error: No merge commits from master to release found{Colors.NC}'
    )
    sys.exit(1)


def get_master_commits_since(commit_hash: str) -> list[str]:
    """Get all commits from the given commit to HEAD on master."""
    print(
        f'{Colors.YELLOW}Getting commits from {commit_hash} to HEAD on master...{Colors.NC}'
    )

    commits_output = run_git_command(
        ['rev-list', '--reverse', f'{commit_hash}..master']
    )

    if not commits_output:
        print(
            f'{Colors.GREEN}✓ No new commits in master since last merge to release{Colors.NC}'
        )
        sys.exit(0)

    commits = commits_output.split('\n')
    print(f'Found {len(commits)} commits to check\n')

    return commits


def get_release_change_ids() -> set[str]:
    """Get all Change-Ids from release branch."""
    print(f'{Colors.YELLOW}Extracting Change-Ids from release branch...{Colors.NC}')

    # Get all commit messages with Change-Id
    commit_messages = run_git_command(
        ['log', 'release', '--grep=Change-Id:', '--format=%B']
    )

    change_ids = set()
    for line in commit_messages.split('\n'):
        if 'Change-Id:' in line:
            change_id = extract_change_id(line)
            if change_id:
                change_ids.add(change_id)

    if not change_ids:
        print(f'{Colors.RED}Warning: No Change-Ids found in release branch{Colors.NC}')

    print(f'Found {len(change_ids)} unique Change-Ids in release\n')

    return change_ids


def get_commit_version_info(
    commit_hash: str, latest_stable: str | None, latest_rc: str | None
) -> str | None:
    """Determine if commit is in latest stable, latest RC, or just unreleased."""
    try:
        # Get the commit message to extract change-id
        commit_message = run_git_command(['log', '-1', '--format=%B', commit_hash])
        change_id = extract_change_id(commit_message)

        if not change_id:
            return None

        # Find the corresponding commit on release branch with this change-id
        try:
            release_commit_output = run_git_command(
                [
                    'log',
                    'release',
                    '--grep',
                    f'Change-Id: {change_id}',
                    '--format=%H',
                    '-1',
                ]
            )
            if not release_commit_output:
                return None

            release_commit = release_commit_output.strip()

            # Check if commit came before latest stable version (i.e., is included in it)
            if latest_stable:
                try:
                    # Check if latest_stable tag is newer than or equal to the commit
                    # This means the commit is included in the stable release
                    run_git_command(
                        ['merge-base', '--is-ancestor', latest_stable, 'release']
                    )
                    # Get the commit date of the release commit and the stable tag
                    release_commit_date = run_git_command(
                        ['log', '-1', '--format=%ct', release_commit]
                    )
                    stable_tag_date = run_git_command(
                        ['log', '-1', '--format=%ct', latest_stable]
                    )

                    # If release commit is older than or equal to stable tag, it's included
                    if int(release_commit_date) <= int(stable_tag_date):
                        return latest_stable
                except subprocess.CalledProcessError:
                    pass

            # Check if commit came before latest RC version
            if latest_rc:
                try:
                    run_git_command(
                        ['merge-base', '--is-ancestor', latest_rc, 'release']
                    )
                    release_commit_date = run_git_command(
                        ['log', '-1', '--format=%ct', release_commit]
                    )
                    rc_tag_date = run_git_command(
                        ['log', '-1', '--format=%ct', latest_rc]
                    )

                    if int(release_commit_date) <= int(rc_tag_date):
                        return latest_rc
                except subprocess.CalledProcessError:
                    pass

            # Commit is on release branch but not in any version tag
            return 'unreleased'

        except subprocess.CalledProcessError:
            return None

    except subprocess.CalledProcessError:
        return None


def check_commits(
    commits: list[str],
    release_change_ids: set[str],
    latest_stable: str | None,
    latest_rc: str | None,
) -> tuple[list[tuple], list[tuple]]:
    """Check each commit against release branch."""
    print(f'{Colors.YELLOW}Checking commits...{Colors.NC}')

    missing_commits = []
    found_commits = []

    for commit in commits:
        # Get commit message, date, and author
        commit_message = run_git_command(['log', '-1', '--format=%B', commit])
        commit_subject = run_git_command(['log', '-1', '--format=%s', commit])
        commit_oneline = run_git_command(['log', '-1', '--oneline', commit])
        commit_date = run_git_command(
            ['log', '-1', '--format=%cd', '--date=format:%d %b %Y', commit]
        )
        commit_short = run_git_command(['log', '-1', '--format=%h', commit])
        commit_author_email = run_git_command(['log', '-1', '--format=%ae', commit])
        commit_author = commit_author_email.split('@')[0]

        change_id = extract_change_id(commit_message)

        if not change_id:
            # No Change-Id found - consider it missing
            missing_commits.append(
                (
                    commit,
                    None,
                    commit_oneline,
                    commit_date,
                    commit_short,
                    None,
                    commit_author,
                )
            )
            status_text = 'MISSING'
            status = f'{Colors.RED}{status_text:<12}{Colors.NC}'
            print(
                f'{status} {commit_short} [{commit_date}] [{"no Change-Id":<40}] {commit_author}: {commit_subject}'
            )
        elif change_id in release_change_ids:
            # Find which version contains this commit
            version_info = get_commit_version_info(commit, latest_stable, latest_rc)
            version_str = f'{version_info}' if version_info else 'unreleased'

            found_commits.append(
                (
                    commit,
                    change_id,
                    commit_oneline,
                    commit_date,
                    commit_short,
                    version_info,
                    commit_author,
                )
            )

            # Choose color based on version type
            if version_info == 'unreleased':
                color = Colors.MAGENTA
            elif version_info and '-rc' in version_info:
                color = Colors.BLUE
            else:
                color = Colors.GREEN

            status = f'{color}{version_str:<12}{Colors.NC}'
            print(
                f'{status} {commit_short} [{commit_date}] [{change_id:<40}] {commit_author}: {commit_subject}'
            )
        else:
            missing_commits.append(
                (
                    commit,
                    change_id,
                    commit_oneline,
                    commit_date,
                    commit_short,
                    None,
                    commit_author,
                )
            )
            status_text = 'MISSING'
            status = f'{Colors.RED}{status_text:<12}{Colors.NC}'
            print(
                f'{status} {commit_short} [{commit_date}] [{change_id:<40}] {commit_author}: {commit_subject}'
            )

    return missing_commits, found_commits


def print_summary(
    missing_commits: list[tuple],
    found_commits: list[tuple],
    last_merged_commit: str,
    total_commits: int,
) -> None:
    """Print summary of results."""
    print(f'\n{Colors.BLUE}=== SUMMARY ==={Colors.NC}')

    if missing_commits:
        print(
            f'{Colors.RED}Missing commits in release ({len(missing_commits)}):{Colors.NC}'
        )
        for (
            commit,
            change_id,
            oneline,
            commit_date,
            commit_short,
            version_info,
            commit_author,
        ) in missing_commits:
            change_id_str = f'{change_id}' if change_id else 'no Change-Id'
            # Remove commit hash from oneline if it starts with it
            subject_only = (
                oneline.split(' ', 1)[1]
                if oneline.startswith(commit_short)
                else oneline
            )
            print(
                f'  {commit_short} [{commit_date}] [{change_id_str:<40}] {commit_author}: {subject_only}'
            )
    else:
        print(f'{Colors.GREEN}✓ All commits are present in release branch{Colors.NC}')

    if found_commits:
        print(
            f'\n{Colors.GREEN}Commits already in release ({len(found_commits)}):{Colors.NC}'
        )

        # Group by version
        version_groups = {}
        for (
            commit,
            change_id,
            oneline,
            commit_date,
            commit_short,
            version_info,
            commit_author,
        ) in found_commits:
            version_key = version_info if version_info else 'unreleased'
            if version_key not in version_groups:
                version_groups[version_key] = []
            version_groups[version_key].append(
                (commit_short, commit_date, change_id, oneline, commit_author)
            )

        # Show grouped by version
        for version, commits in version_groups.items():
            version_str = f'[{version}]' if version != 'unreleased' else '[unreleased]'
            print(
                f'\n  {Colors.BLUE}{version_str}{Colors.NC} ({len(commits)} commits):'
            )
            for commit_short, commit_date, change_id, oneline, commit_author in commits:
                # Remove commit hash from oneline if it starts with it
                subject_only = (
                    oneline.split(' ', 1)[1]
                    if oneline.startswith(commit_short)
                    else oneline
                )
                print(
                    f'    {commit_short} [{commit_date}] [{change_id:<40}] {commit_author}: {subject_only}'
                )

    print(f'\n{Colors.BLUE}Range checked: {last_merged_commit}..master{Colors.NC}')
    print(f'{Colors.BLUE}Total commits checked: {total_commits}{Colors.NC}')


def parse_version(version_str: str) -> tuple:
    """Parse version string into comparable tuple."""
    # Remove 'v' prefix if present
    if version_str.startswith('v'):
        version_str = version_str[1:]

    if '-rc.' in version_str:
        # RC version like "0.6.14-rc.1"
        base_part, rc_part = version_str.split('-rc.')
        base_parts = [int(x) for x in base_part.split('.')]
        rc_num = int(rc_part)
        # RC versions are considered "less than" stable versions
        return tuple(base_parts + [-1, rc_num])
    else:
        # Stable version like "0.6.14"
        base_parts = [int(x) for x in version_str.split('.')]
        # Stable versions get 0 as RC indicator (higher than -1)
        return tuple(base_parts + [0])


def get_release_version_info() -> tuple[str | None, str | None]:
    """Get latest version and RC version tags."""
    print(f'{Colors.YELLOW}Getting release version information...{Colors.NC}')

    # Get all tags
    all_tags = run_git_command(['tag', '-l'])

    if not all_tags:
        print(f'{Colors.RED}No tags found{Colors.NC}')
        return None, None

    tags = all_tags.split('\n')

    # Filter and parse valid version tags
    valid_tags = []
    for tag in tags:
        if re.match(r'^v?\d+\.\d+\.\d+(-rc\.\d+)?$', tag):
            try:
                parsed = parse_version(tag)
                valid_tags.append((tag, parsed))
            except (ValueError, IndexError):
                continue

    if not valid_tags:
        print(f'Latest version: {Colors.RED}No valid version tags found{Colors.NC}')
        return None, None

    # Sort by parsed version (highest first)
    valid_tags.sort(key=lambda x: x[1], reverse=True)

    # Find latest stable and RC versions
    latest_stable = None
    latest_rc = None

    for tag, _ in valid_tags:
        if '-rc' not in tag and latest_stable is None:
            latest_stable = tag
        elif '-rc' in tag and latest_rc is None:
            latest_rc = tag

    # Determine what to show
    overall_latest = valid_tags[0][0]  # First item is highest version

    if '-rc' not in overall_latest:
        # Latest is stable, show only this
        version_commit = run_git_command(['rev-list', '-n', '1', overall_latest])
        version_date = run_git_command(
            ['log', '-1', '--format=%cd', '--date=format:%d %b %Y', version_commit]
        )
        print(
            f'Latest version: {Colors.GREEN}{overall_latest}{Colors.NC} ({version_date})'
        )
        return overall_latest, None
    else:
        # Latest is RC, show both RC and latest stable
        rc_commit = run_git_command(['rev-list', '-n', '1', latest_rc])
        rc_date = run_git_command(
            ['log', '-1', '--format=%cd', '--date=format:%d %b %Y', rc_commit]
        )
        print(f'Latest RC version: {Colors.GREEN}{latest_rc}{Colors.NC} ({rc_date})')

        if latest_stable:
            stable_commit = run_git_command(['rev-list', '-n', '1', latest_stable])
            stable_date = run_git_command(
                ['log', '-1', '--format=%cd', '--date=format:%d %b %Y', stable_commit]
            )
            print(
                f'Latest stable version: {Colors.GREEN}{latest_stable}{Colors.NC} ({stable_date})'
            )
        else:
            print(f'Latest stable version: {Colors.RED}Not found{Colors.NC}')

        return latest_stable, latest_rc


def main() -> int:
    """Main function."""
    print(
        f'{Colors.BLUE}=== Checking for commits in master missing from release ==={Colors.NC}\n'
    )

    # Get release version info
    latest_stable, latest_rc = get_release_version_info()
    print()

    # Find last merge commit
    _, last_merged_commit = get_last_merge_commit()
    print()

    # Get commits to check
    master_commits = get_master_commits_since(last_merged_commit)

    # Get Change-Ids from release
    release_change_ids = get_release_change_ids()

    # Check commits
    missing_commits, found_commits = check_commits(
        master_commits, release_change_ids, latest_stable, latest_rc
    )

    # Print summary
    print_summary(
        missing_commits, found_commits, last_merged_commit, len(master_commits)
    )

    return 0


if __name__ == '__main__':
    sys.exit(main())

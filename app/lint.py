#!/usr/bin/env python3
import os
import sys
from contextlib import contextmanager

from pylint.lint import Run as RunPylint

PROJECT_DIR = os.path.join(os.path.dirname(__file__), 'pm')


@contextmanager
def chdir(dir_: str) -> None:
    old_dir = os.getcwd()
    os.chdir(dir_)
    try:
        yield
    finally:
        os.chdir(old_dir)


def run_pylint() -> int:
    with chdir(PROJECT_DIR):
        res = RunPylint(['.'], exit=False)
        if res.linter.any_fail_on_issues():
            return res.linter.msg_status or 1
        return res.linter.msg_status or 0


def main() -> int:
    return run_pylint()


if __name__ == '__main__':
    sys.exit(main())

import os
import sys

from pylint.lint import Run as RunPylint

PROJECT_DIR = os.path.join(os.path.dirname(__file__), 'pm')


def run_pylint() -> int:
    res = RunPylint([PROJECT_DIR], exit=False)
    if res.linter.any_fail_on_issues():
        return res.linter.msg_status or 1
    return res.linter.msg_status or 0


def main() -> int:
    return run_pylint()


if __name__ == '__main__':
    sys.exit(main())

# pylint: disable=import-outside-toplevel
import argparse

__all__ = ('add_tasks_args',)


# pylint: disable=unused-argument
def run_worker(args: argparse.Namespace) -> None:
    from pm.tasks.app import celery_app

    celery_app.start(argv=['worker'])


def run_beat(args: argparse.Namespace) -> None:
    from pm.tasks.app import celery_app

    celery_app.start(argv=['beat', '-s', args.schedule])


def add_tasks_args(parser: argparse.ArgumentParser) -> None:
    subparsers = parser.add_subparsers(required=True)

    worker_parser = subparsers.add_parser('worker')
    worker_parser.set_defaults(func=run_worker)

    beat_parser = subparsers.add_parser('beat')
    beat_parser.add_argument(
        '-s',
        '--schedule',
        type=str,
        default='/tmp/celerybeat-schedule',
        help='Path to the schedule file',
    )
    beat_parser.set_defaults(func=run_beat)

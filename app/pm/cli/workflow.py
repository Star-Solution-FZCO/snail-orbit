# pylint: disable=import-outside-toplevel
import argparse

__all__ = ('add_workflow_args',)


async def init_db() -> None:
    from beanie import init_beanie
    from motor.motor_asyncio import AsyncIOMotorClient

    from pm.config import CONFIG
    from pm.models import __beanie_models__

    client = AsyncIOMotorClient(CONFIG.DB_URI)
    db = client.get_default_database()
    await init_beanie(db, document_models=__beanie_models__)


async def create_wf(args: argparse.Namespace) -> None:
    from croniter import croniter

    from pm.models import OnChangeWorkflow, ScheduledWorkflow, WorkflowType

    await init_db()

    if args.type == WorkflowType.ON_CHANGE:
        obj = OnChangeWorkflow(
            name=args.name,
            script=args.script_path,
            type=WorkflowType.ON_CHANGE,
            description=args.description,
        )
        await obj.insert()
    if args.type == WorkflowType.SCHEDULED:
        if not args.schedule:
            raise ValueError('Schedule is required for scheduled workflows')
        if not croniter.is_valid(args.schedule):
            raise ValueError(f'Invalid cron expression: {args.schedule}')
        obj = ScheduledWorkflow(
            name=args.name,
            script=args.script_path,
            type=WorkflowType.SCHEDULED,
            description=args.description,
            schedule=args.schedule,
        )
        await obj.insert()
    else:
        raise ValueError(f'Unknown workflow type: {args.type}')
    print(f'Workflow {args.name} created successfully, id={obj.id}')


# pylint: disable=unused-argument
async def show_wf(args: argparse.Namespace) -> None:
    from pm.models import Workflow

    await init_db()
    objs = await Workflow.all(with_children=True).to_list()
    for obj in objs:
        print(f'{obj.id=} {obj.name=} {obj.type=} {obj.script=} {obj.description=}')


def add_workflow_args(parser: argparse.ArgumentParser) -> None:
    subparsers = parser.add_subparsers(required=True)

    create_parser = subparsers.add_parser('create', help='Create a new workflow')
    create_parser.add_argument('name', type=str)
    create_parser.add_argument('script_path', type=str)
    create_parser.add_argument(
        '-t', '--type', choices=['on_change', 'scheduled'], required=True
    )
    create_parser.add_argument('--description', type=str)
    create_parser.add_argument('-s', '--schedule', type=str)
    create_parser.set_defaults(func=create_wf)

    show_parser = subparsers.add_parser('show', help='Show all workflows')
    show_parser.set_defaults(func=show_wf)

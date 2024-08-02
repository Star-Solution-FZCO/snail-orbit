import argparse
from getpass import getpass

__all__ = ('add_user_args',)


async def init_db() -> None:
    from beanie import init_beanie
    from motor.motor_asyncio import AsyncIOMotorClient

    from pm.config import CONFIG
    from pm.models import __beanie_models__

    client = AsyncIOMotorClient(CONFIG.DB_URI)
    db = client.get_default_database()
    await init_beanie(db, document_models=__beanie_models__)


async def create_user(args: argparse.Namespace) -> None:
    from pm.models import User

    await init_db()
    password = getpass('Enter password: ')
    if not password:
        print('Password is empty')
        return
    name = args.name or args.email.split('@', maxsplit=1)[0]
    user = User(email=args.email, name=name, is_admin=args.admin)
    user.password_hash = User.hash_password(password)
    await user.insert()
    print(f'User {args.email} created successfully, id={user.id}')


async def show_users(args: argparse.Namespace) -> None:
    from pm.models import User

    await init_db()
    users = await User.all().to_list()
    for user in users:
        print(f'{user.id=} {user.email=} {user.name=} {user.is_admin=}')


async def gen_api_token(args: argparse.Namespace) -> None:
    from beanie import PydanticObjectId

    from pm.models import User

    await init_db()
    user = await User.find_one(User.id == PydanticObjectId(args.user_id))
    if not user:
        print(f'User with id={args.user_id} not found')
        return
    token, token_obj = user.gen_new_api_token(args.name)
    user.api_tokens.append(token_obj)
    await user.save_changes()
    print(f'API token: {token}')


def add_user_args(parser: argparse.ArgumentParser) -> None:
    subparsers = parser.add_subparsers(required=True)

    create_parser = subparsers.add_parser('create', help='Create a new user')
    create_parser.add_argument('email', type=str)
    create_parser.add_argument('--name', type=str)
    create_parser.add_argument('--admin', action='store_true')
    create_parser.set_defaults(func=create_user)

    show_parser = subparsers.add_parser('show', help='Show all users')
    show_parser.set_defaults(func=show_users)

    gen_api_token_parser = subparsers.add_parser(
        'gen_api_token', help='Generate API token'
    )
    gen_api_token_parser.add_argument('user_id', type=str)
    gen_api_token_parser.add_argument('name', type=str)
    gen_api_token_parser.set_defaults(func=gen_api_token)

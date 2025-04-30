# pylint: disable=import-outside-toplevel
import argparse
import json
import os
from collections.abc import Generator
from contextlib import contextmanager

__all__ = ('add_api_args',)


def run_api_server(args: argparse.Namespace) -> None:
    import uvicorn

    uvicorn.run(
        'pm.api.app:app',
        host=args.host,
        port=args.port,
        forwarded_allow_ips=args.trusted_proxy,
    )


@contextmanager
def set_envs(envs: dict[str, str]) -> Generator[None]:
    old_envs = {}
    for k, v in envs.items():
        old_envs[k] = os.getenv(k)
        os.environ[k] = v
    try:
        yield
    finally:
        for k, v in old_envs.items():
            if v is None:
                os.unsetenv(k)
                continue
            os.environ[k] = v


def gen_openapi_schema() -> dict:
    from fastapi.openapi.utils import get_openapi

    envs = {
        # this secret is used for generating the openapi schema only
        'SNAIL_ORBIT_JWT_SECRET': 'nosec',  # nosec: hardcoded_password_string
    }
    with set_envs(envs):
        from pm.api.app import app

        return get_openapi(
            title=app.title,
            version=app.version,
            openapi_version=app.openapi_version,
            description=app.description,
            routes=app.routes,
        )


def gen_openapi(args: argparse.Namespace) -> None:
    openapi_schema = gen_openapi_schema()
    with open(args.output, 'w', encoding='utf-8') as fp:
        json.dump(openapi_schema, fp=fp, indent=args.indent)
        fp.write('\n')


def check_openapi(args: argparse.Namespace) -> None:
    try:
        import deepdiff
    except ImportError:
        deepdiff = None

    with open(args.file, 'r', encoding='utf-8') as in_file:
        data = json.load(in_file)
    openapi_schema = gen_openapi_schema()

    if not deepdiff:
        if data == openapi_schema:
            return
        raise ValueError('OpenAPI schema mismatch')

    diff = deepdiff.DeepDiff(data, openapi_schema)
    if not diff:
        return
    raise ValueError(f'OpenAPI schema mismatch:\n{diff.pretty()}')


def add_api_args(parser: argparse.ArgumentParser) -> None:
    subparsers = parser.add_subparsers(required=True)

    server_parser = subparsers.add_parser('server')
    server_parser.add_argument('--host', type=str, default='localhost')
    server_parser.add_argument('--port', type=int, default=9090)
    server_parser.add_argument('--trusted-proxy', type=str, default='127.0.0.1')
    server_parser.set_defaults(func=run_api_server)

    openapi_parser = subparsers.add_parser('openapi')
    openapi_subparsers = openapi_parser.add_subparsers(required=True)

    openapi_gen_parser = openapi_subparsers.add_parser('gen')
    openapi_gen_parser.add_argument('--indent', type=int, default=2)
    openapi_gen_parser.add_argument('-o', '--output', type=str, default='openapi.json')
    openapi_gen_parser.set_defaults(func=gen_openapi)

    openapi_check_parser = openapi_subparsers.add_parser('check')
    openapi_check_parser.add_argument('-f', '--file', type=str, default='openapi.json')
    openapi_check_parser.set_defaults(func=check_openapi)

# pylint: disable=import-outside-toplevel
import argparse
import json
import logging
import multiprocessing
import os
from collections.abc import Generator
from contextlib import contextmanager
from typing import Any

__all__ = ('add_api_args',)


def run_api_server(args: argparse.Namespace) -> None:
    from gunicorn.app.base import Arbiter, BaseApplication

    workers = args.workers
    if workers == 0:
        workers = max(multiprocessing.cpu_count() - 1, 1)

    def on_starting(arbiter: Arbiter) -> None:  # pylint: disable=unused-argument
        from pm.config import LOG_FORMAT, LOG_LEVEL
        from pm.db.version import check_database_version
        from pm.logging import setup_logging

        setup_logging(
            'pm',
            level=LOG_LEVEL,
            format_type=LOG_FORMAT,
        )

        check_database_version()

        logger = logging.getLogger('pm.api.startup')
        logger.info(
            'Starting API server on %s with %s workers',
            arbiter.address,
            arbiter.num_workers,
        )

    class StandaloneApplication(BaseApplication):
        def __init__(self, app_module: str, options: dict) -> None:
            self.app_module = app_module
            self.options = options
            super().__init__()

        def init(self, parser: Any, opts: Any, args: Any) -> None:  # pylint: disable=unused-argument
            pass

        def load_config(self) -> None:
            for key, value in self.options.items():
                self.cfg.set(key, value)
            self.cfg.set('on_starting', on_starting)

        def load(self) -> str:
            return self.app_module

    StandaloneApplication(
        'pm.api.app:app',
        {
            'bind': f'{args.host}:{args.port}',
            'workers': workers,
            'worker_class': 'uvicorn.workers.UvicornWorker',
            'forwarded_allow_ips': args.trusted_proxy,
            'timeout': 120,
            'keepalive': 5,
            'loglevel': 'error',
        },
    ).run()


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
        'SNAIL_ORBIT_OIDC_ENABLED': 'true',
        'SNAIL_ORBIT_OIDC_CLIENT_ID': 'dummy',
        'SNAIL_ORBIT_OIDC_CLIENT_SECRET': 'dummy',
        'SNAIL_ORBIT_OIDC_DISCOVERY_URL': 'https://example.com/.well-known/openid-configuration',
        'SNAIL_ORBIT_OIDC_SESSION_SECRET': 'dummy',
        'SNAIL_ORBIT_TASKS_BROKER_URL': 'amqp://localhost:5672/',
    }
    with set_envs(envs):
        from pm.api.app import app

        schema = get_openapi(
            title=app.title,
            version=app.version,
            openapi_version=app.openapi_version,
            description=app.description,
            routes=app.routes,
        )

        # Include all mounted FastAPI sub-apps
        from fastapi import FastAPI

        for route in app.routes:
            if (
                hasattr(route, 'app')
                and hasattr(route, 'path')
                and isinstance(route.app, FastAPI)
            ):
                sub_app = route.app
                mount_path = route.path.rstrip('/')

                # Generate schema for the sub-app
                sub_schema = get_openapi(
                    title=sub_app.title or 'Sub App',
                    version=sub_app.version or '1.0.0',
                    routes=sub_app.routes,
                )

                # Add sub-app paths with proper prefix
                for path, methods in sub_schema.get('paths', {}).items():
                    prefixed_path = mount_path + ('' if path == '/' else path)
                    schema['paths'][prefixed_path] = methods

                # Merge components if they exist
                if 'components' in sub_schema:
                    if 'components' not in schema:
                        schema['components'] = {}
                    for component_type, components in sub_schema['components'].items():
                        if component_type not in schema['components']:
                            schema['components'][component_type] = {}
                        schema['components'][component_type].update(components)

        return schema


def gen_openapi(args: argparse.Namespace) -> None:
    from pathlib import Path

    openapi_schema = gen_openapi_schema()
    Path(args.output).write_text(
        json.dumps(openapi_schema, indent=args.indent) + '\n',
        encoding='utf-8',
    )


def check_openapi(args: argparse.Namespace) -> None:
    from pathlib import Path

    try:
        import deepdiff
    except ImportError:
        deepdiff = None

    data = json.loads(Path(args.file).read_text(encoding='utf-8'))
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
    server_parser.add_argument(
        '--workers',
        type=int,
        default=1,
        help='Number of worker processes (0=auto-detect CPU cores, >=1=specific count)',
    )
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

# pylint: disable=import-outside-toplevel
import argparse

__all__ = ('add_api_args',)


def run_api_server(args: argparse.Namespace) -> None:
    import uvicorn

    uvicorn.run(
        'pm.api.app:app',
        host=args.host,
        port=args.port,
        forwarded_allow_ips=args.trusted_proxy,
    )


def gen_openapi(args: argparse.Namespace) -> None:
    import json
    import os

    from fastapi.openapi.utils import get_openapi

    # this secret is used for generating the openapi schema only
    os.environ['SNAIL_ORBIT_JWT_SECRET'] = 'nosec'  # nosec: hardcoded_password_string

    from pm.api.app import app

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        openapi_version=app.openapi_version,
        description=app.description,
        routes=app.routes,
    )
    with open(args.output, 'w', encoding='utf-8') as fp:
        json.dump(openapi_schema, fp=fp, indent=args.indent)


def add_api_args(parser: argparse.ArgumentParser) -> None:
    subparsers = parser.add_subparsers(required=True)

    server_parser = subparsers.add_parser('server')
    server_parser.add_argument('--host', type=str, default='localhost')
    server_parser.add_argument('--port', type=int, default=9090)
    server_parser.add_argument('--trusted-proxy', type=str, default='127.0.0.1')
    server_parser.set_defaults(func=run_api_server)

    openapi_parser = subparsers.add_parser('openapi')
    openapi_parser.add_argument('--indent', type=int, default=2)
    openapi_parser.add_argument('-o', '--output', type=str, default='openapi.json')
    openapi_parser.set_defaults(func=gen_openapi)

import argparse

__all__ = ('add_api_args',)


def run_api(args: argparse.Namespace) -> None:
    import uvicorn

    uvicorn.run('pm.api.app:app', host=args.host, port=args.port)


def add_api_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument('--host', type=str, default='localhost')
    parser.add_argument('--port', type=int, default=9090)
    parser.set_defaults(func=run_api)

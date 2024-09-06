import argparse

__all__ = ('add_api_args',)


def run_api(args: argparse.Namespace) -> None:
    import uvicorn

    uvicorn.run(
        'pm.api.app:app',
        host=args.host,
        port=args.port,
        forwarded_allow_ips=args.trusted_proxy,
    )


def add_api_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument('--host', type=str, default='localhost')
    parser.add_argument('--port', type=int, default=9090)
    parser.add_argument('--trusted-proxy', type=str, default='127.0.0.1')
    parser.set_defaults(func=run_api)

import argparse

__all__ = ('add_ocr_args',)


def run_ocr(args: argparse.Namespace) -> None:
    from pm.ocr.app import run

    run()


def add_ocr_args(parser: argparse.ArgumentParser) -> None:
    parser.set_defaults(func=run_ocr)

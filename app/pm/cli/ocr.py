# pylint: disable=import-outside-toplevel
import argparse

__all__ = ('add_ocr_args',)


# pylint: disable=unused-argument
# ruff: noqa: ARG001
def run_ocr(args: argparse.Namespace) -> None:
    from pm.ocr.app import run

    run()


def add_ocr_args(parser: argparse.ArgumentParser) -> None:
    parser.set_defaults(func=run_ocr)

#!/bin/sh
python3 -m ruff format --no-cache .
python3 -m ruff check --select I --fix .

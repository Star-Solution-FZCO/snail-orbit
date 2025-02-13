from collections.abc import Callable
from typing import Any

from beanie import PydanticObjectId
from fastapi import Depends, Query
from fastapi.exceptions import RequestValidationError
from pydantic_core import PydanticUndefined

__all__ = (
    'query_comma_separated_list_param',
    'pydantic_object_id_validator',
)


def pydantic_object_id_validator(value: str) -> PydanticObjectId:
    return PydanticObjectId(value)


def query_comma_separated_list_param(
    param_name: str,
    required: bool = True,
    description: str | None = None,
    single_value_validator: Callable[[str], Any] | None = None,
) -> Any:
    def _parser(
        vals: str | None = Query(
            PydanticUndefined if required else None,
            alias=param_name,
            description=description or 'Comma-separated list of values',
        ),
    ) -> list | None:
        if vals is None:
            return None
        items = [v.strip() for v in vals.split(',')]
        if not single_value_validator:
            return items
        try:
            return [single_value_validator(item) for item in items]
        except Exception as err:
            raise RequestValidationError(
                [
                    {
                        'loc': ['query', param_name],
                        'msg': str(err),
                        'type': 'value_error',
                    }
                ]
            ) from err

    return Depends(_parser)

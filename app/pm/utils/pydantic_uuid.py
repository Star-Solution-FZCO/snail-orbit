from typing import TYPE_CHECKING, Any
from uuid import UUID

from pydantic import GetCoreSchemaHandler, GetJsonSchemaHandler
from pydantic_core import core_schema

if TYPE_CHECKING:
    from pydantic.json_schema import JsonSchemaValue


__all__ = ('UUIDStr',)


class UUIDStr(str):
    """A custom string type that validates a string is a valid UUID format."""

    @classmethod
    def validate(cls, v: Any) -> str | None:
        if v is None:
            return None
        try:
            v = str(v)
            UUID(v)
        except (ValueError, AttributeError, TypeError) as err:
            raise ValueError('Must be a valid UUID') from err

        return v

    # pylint: disable=unused-argument
    @classmethod
    def __get_pydantic_core_schema__(
        cls,
        _source_type: Any,
        _handler: GetCoreSchemaHandler,
    ) -> core_schema.CoreSchema:
        return core_schema.union_schema(
            [
                core_schema.is_instance_schema(cls),
                core_schema.chain_schema(
                    [
                        core_schema.StringSchema(type='str'),
                        core_schema.no_info_plain_validator_function(cls.validate),
                    ],
                ),
                core_schema.none_schema(),
            ],
        )

    @classmethod
    def __get_pydantic_json_schema__(
        cls,
        _core_schema: core_schema.CoreSchema,
        handler: GetJsonSchemaHandler,
    ) -> 'JsonSchemaValue':
        return {
            'type': 'string',
            'format': 'uuid',
            'pattern': '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
            'description': 'UUID string',
        }

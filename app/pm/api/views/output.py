from collections.abc import Callable
from typing import TYPE_CHECKING, Any, Generic, Self, TypeVar
from uuid import UUID

from beanie import PydanticObjectId
from pydantic import BaseModel

if TYPE_CHECKING:
    from beanie import Document
    from beanie.odm.queries.find import AggregationQuery, FindMany

__all__ = (
    'BaseOutput',
    'ErrorOutput',
    'ErrorPayloadOutput',
    'SuccessOutput',
    'BasePayloadOutput',
    'SuccessPayloadOutput',
    'BaseListOutput',
    'ModelIdOutput',
    'UUIDOutput',
    'MFARequiredOutput',
)


class BaseOutput(BaseModel):
    success: bool

    @classmethod
    def get_openapi_content(cls) -> dict[str, Any]:
        """Generate OpenAPI content for application/json."""
        if not hasattr(cls, 'get_example'):
            raise NotImplementedError(
                f'{cls.__name__} must implement get_example() method'
            )

        example_instance = cls.get_example()
        example_name = cls.__name__.lower().replace('output', '_example')
        examples = {
            example_name: {
                'summary': f'{cls.__name__} Example',
                'value': example_instance.model_dump(),
            }
        }
        return {
            'application/json': {
                'schema': cls.model_json_schema(),
                'examples': examples,
            }
        }


class SuccessOutput(BaseOutput):
    success: bool = True


class ErrorOutput(BaseOutput):
    success: bool = False
    error_messages: list[str]

    @classmethod
    def get_example(cls) -> Self:
        """Generate a canonical example for OpenAPI documentation."""
        return cls(error_messages=['Operation failed'])


class MFARequiredOutput(BaseOutput):
    success: bool = False
    mfa_required: bool = True

    @classmethod
    def get_example(cls) -> Self:
        """Generate a canonical example for OpenAPI documentation."""
        return cls()


T = TypeVar('T')
DocT = TypeVar('DocT', bound='Document')


class BasePayloadOutput(BaseOutput, Generic[T]):
    payload: T


class SuccessPayloadOutput(SuccessOutput, BasePayloadOutput, Generic[T]):
    pass


class ErrorPayloadOutput(ErrorOutput, BasePayloadOutput, Generic[T]):
    error_fields: dict[str, str]

    @classmethod
    def get_example(cls) -> Self:
        """Generate a canonical example for OpenAPI documentation."""
        return cls(
            error_messages=['Validation failed'],
            error_fields={'field_name': 'Error description'},
            payload={},
        )


class ModelIDPayload(BaseModel):
    id: PydanticObjectId


class ModelIdOutput(SuccessPayloadOutput[ModelIDPayload]):
    @classmethod
    def make(cls, id_: PydanticObjectId) -> Self:
        return cls(payload=ModelIDPayload(id=id_))

    @classmethod
    def from_obj(cls, obj: Any) -> Self:
        return cls(payload=ModelIDPayload(id=obj.id))


class UUIDPayload(BaseModel):
    id: UUID


class UUIDOutput(SuccessPayloadOutput[UUIDPayload]):
    @classmethod
    def make(cls, id_: UUID) -> Self:
        return cls(payload=UUIDPayload(id=id_))


class BaseListPayload(BaseModel, Generic[T]):
    count: int
    limit: int
    offset: int
    items: list[T]


class BaseSelectItem(BaseModel, Generic[T]):
    label: str
    value: T


class StrSelectItem(BaseSelectItem[str]):
    pass


class IntSelectItem(BaseSelectItem[int]):
    pass


class BaseListOutput(SuccessPayloadOutput, Generic[T]):
    payload: BaseListPayload[T]

    @classmethod
    def make(
        cls, items: list[T], count: int, limit: int, offset: int
    ) -> 'BaseListOutput[T]':
        return cls(
            payload=BaseListPayload(
                count=count, limit=limit, offset=offset, items=items
            )
        )

    @classmethod
    async def make_from_query(
        cls,
        q: 'FindMany[DocT]',
        limit: int,
        offset: int,
        projection_fn: Callable[[DocT], T],
    ) -> 'BaseListOutput[T]':
        return cls.make(
            count=await q.count(),
            limit=limit,
            offset=offset,
            items=[projection_fn(obj) async for obj in q.limit(limit).skip(offset)],
        )

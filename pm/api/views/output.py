from typing import Any, Generic, Self, TypeVar

from pydantic import BaseModel as PydanticBaseModel

__all__ = (
    'BaseOutput',
    'SuccessOutput',
    'BasePayloadOutput',
    'SuccessPayloadOutput',
    'BaseListOutput',
    'ModelIdOutput',
)


class BaseOutput(PydanticBaseModel):
    success: bool


class SuccessOutput(BaseOutput):
    success: bool = True


T = TypeVar('T')


class BasePayloadOutput(BaseOutput, Generic[T]):
    payload: T


class SuccessPayloadOutput(SuccessOutput, BasePayloadOutput, Generic[T]):
    pass


class ModelIDPayload(PydanticBaseModel):
    id: int


class ModelIdOutput(SuccessPayloadOutput[ModelIDPayload]):
    @classmethod
    def make(cls, id_: int) -> Self:
        return cls(payload=ModelIDPayload(id=id_))

    @classmethod
    def from_obj(cls, obj: Any) -> Self:
        return cls(payload=ModelIDPayload(id=obj.id))


class BaseListPayload(PydanticBaseModel, Generic[T]):
    count: int
    limit: int
    offset: int
    items: list[T]


class BaseSelectItem(PydanticBaseModel, Generic[T]):
    label: str
    value: T


class StrSelectItem(BaseSelectItem[str]):
    pass


class IntSelectItem(BaseSelectItem[int]):
    pass


class BaseListOutput(SuccessPayloadOutput, Generic[T]):
    payload: BaseListPayload[T]

    @classmethod
    def make(cls, items: list[T], count: int, limit: int, offset: int) -> Self:
        return cls(
            payload=BaseListPayload(
                count=count, limit=limit, offset=offset, items=items
            )
        )

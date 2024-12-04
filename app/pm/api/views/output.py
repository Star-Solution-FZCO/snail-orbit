from typing import Any, Generic, Self, TypeVar
from uuid import UUID

from beanie import PydanticObjectId
from pydantic import BaseModel

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


class SuccessOutput(BaseOutput):
    success: bool = True


class ErrorOutput(BaseOutput):
    success: bool = False
    error_messages: list[str]


class MFARequiredOutput(BaseOutput):
    success: bool = False
    mfa_required: bool = True


T = TypeVar('T')


class BasePayloadOutput(BaseOutput, Generic[T]):
    payload: T


class SuccessPayloadOutput(SuccessOutput, BasePayloadOutput, Generic[T]):
    pass


class ErrorPayloadOutput(ErrorOutput, BasePayloadOutput, Generic[T]):
    error_fields: dict[str, str]


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
    def make(cls, items: list[T], count: int, limit: int, offset: int) -> Self:
        return cls(
            payload=BaseListPayload(
                count=count, limit=limit, offset=offset, items=items
            )
        )

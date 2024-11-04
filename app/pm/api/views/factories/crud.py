from abc import ABC
from typing import TYPE_CHECKING, Generic, Self, TypeVar

from beanie import PydanticObjectId
from pydantic import BaseModel

if TYPE_CHECKING:
    from beanie import Document

__all__ = (
    'CrudOutput',
    'CrudCreateBody',
    'CrudUpdateBody',
)

ModelT = TypeVar('ModelT', bound='Document')


class CrudOutput(BaseModel, ABC, Generic[ModelT]):
    id: PydanticObjectId

    @classmethod
    def from_obj(cls, obj: ModelT) -> Self:
        return cls(**{k: getattr(obj, k) for k in cls.__fields__})


class CrudCreateBody(BaseModel, ABC, Generic[ModelT]):
    def create_obj(self, model: type[ModelT]) -> ModelT:
        return model(**self.model_dump(exclude_unset=True))


class CrudUpdateBody(BaseModel, ABC, Generic[ModelT]):
    def update_obj(self, obj: ModelT) -> None:
        for k, v in self.model_dump(exclude_unset=True).items():
            setattr(obj, k, v)

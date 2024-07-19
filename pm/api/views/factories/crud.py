from abc import ABC, abstractmethod
from typing import Generic, TypeVar, TYPE_CHECKING, Self
from pydantic import BaseModel as PydanticBaseModel

if TYPE_CHECKING:
    from starsol_sql_base import BaseModel

__all__ = (
    'CrudOutput',
    'CrudCreateBody',
    'CrudUpdateBody',
)

ModelT = TypeVar('ModelT', bound='BaseModel')


class CrudOutput(PydanticBaseModel, ABC, Generic[ModelT]):
    @classmethod
    def from_obj(cls, obj: ModelT) -> Self:
        return cls(
            **{k: getattr(obj, k)
                for k in cls.__fields__
            }
        )


class CrudCreateBody(PydanticBaseModel, ABC, Generic[ModelT]):
    def create_obj(self, model: type[ModelT]) -> ModelT:
        return model(**self.model_dump(exclude_unset=True))


class CrudUpdateBody(PydanticBaseModel, ABC, Generic[ModelT]):
    def update_obj(self, obj: ModelT) -> None:
        for k, v in self.model_dump(exclude_unset=True).items():
            setattr(obj, k, v)

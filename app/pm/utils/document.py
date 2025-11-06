from collections.abc import Collection
from typing import Annotated, ClassVar, Self, Unpack

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from pydantic.config import ConfigDict

__all__ = (
    'DocumentIdRO',
    'DocumentWithReadOnlyProjection',
    'init_read_only_projection_models',
)


class DocumentIdRO(BaseModel):
    id: Annotated[PydanticObjectId, Field(alias='_id')]


class DocumentWithReadOnlyProjection(Document):
    __ro_projection_model__: ClassVar[type[Self]]
    __is_ro_projection_model_initialized__: ClassVar[bool] = False

    def __init_subclass__(
        cls,
        is_ro_projection_model: bool = False,
        **kwargs: Unpack[ConfigDict],
    ) -> None:
        super().__init_subclass__(**kwargs)

        if is_ro_projection_model:
            cls.__ro_projection_model__ = cls
            return

        class ReadOnlyModel(cls, is_ro_projection_model=True):
            pass

        ReadOnlyModel.__name__ = f'{cls.__name__}ReadOnly'
        cls.__ro_projection_model__ = ReadOnlyModel

    @classmethod
    def init_ro_projection_model(cls) -> None:
        # pylint: disable=protected-access
        if cls.__is_ro_projection_model_initialized__:
            return
        cls.__is_ro_projection_model_initialized__ = True

        if not cls._document_settings:
            return

        cls.__ro_projection_model__._document_settings = (
            cls._document_settings.model_copy()
        )
        cls.__ro_projection_model__._document_settings.state_management_save_previous = False
        cls.__ro_projection_model__._document_settings.use_revision = False
        cls.__ro_projection_model__._document_settings.use_state_management = False

    @classmethod
    def get_ro_projection_model(cls) -> type[Self]:
        if not cls.__is_ro_projection_model_initialized__:
            raise RuntimeError(
                f'{cls.__name__}: read-only projection model is not initialized',
            )
        return cls.__ro_projection_model__


def init_read_only_projection_models(models: Collection[type[Document]]) -> None:
    for model in models:
        if not issubclass(model, DocumentWithReadOnlyProjection):
            continue
        model.init_ro_projection_model()

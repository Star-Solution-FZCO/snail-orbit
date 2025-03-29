from collections.abc import Collection
from typing import ClassVar, Self

from beanie import Document
from pydantic.config import ConfigDict
from typing_extensions import Unpack

__all__ = (
    'DocumentWithReadOnlyProjection',
    'init_read_only_projection_models',
)


class DocumentWithReadOnlyProjection(Document):
    __ro_projection_model: ClassVar[type[Self]]
    __ro_projection_model_initialized: ClassVar[bool] = False

    def __init_subclass__(
        cls, is_ro_projection_model: bool = False, **kwargs: Unpack[ConfigDict]
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
        if cls.__ro_projection_model_initialized:
            return
        cls.__ro_projection_model_initialized = True

        if not cls._document_settings:
            return

        cls._document_settings = cls._document_settings.model_copy()
        cls._document_settings.state_management_save_previous = False
        cls._document_settings.use_revision = False
        cls._document_settings.use_state_management = False

    @classmethod
    def get_ro_projection_model(cls) -> type[Self]:
        if not cls.__ro_projection_model_initialized:
            raise RuntimeError(
                f'{cls.__name__}: read-only projection model is not initialized'
            )
        return cls.__ro_projection_model__


def init_read_only_projection_models(models: Collection[type[Document]]) -> None:
    for model in models:
        if not issubclass(model, DocumentWithReadOnlyProjection):
            continue
        model.init_ro_projection_model()

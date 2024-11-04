from datetime import datetime
from enum import StrEnum
from os.path import dirname as opd
from os.path import join as opj
from typing import Self, TypeVar
from uuid import UUID

import aiofiles
import aiofiles.os as aio_os
import bson
from beanie import (
    Delete,
    Document,
    Indexed,
    Insert,
    PydanticObjectId,
    Replace,
    SaveChanges,
    after_event,
    before_event,
)
from pydantic import BaseModel
from starlette_context import context
from starlette_context.errors import ContextDoesNotExistError

from pm.config import CONFIG
from pm.utils.dateutils import utcnow

__all__ = (
    'AuditRecord',
    'AuditAuthorField',
    'audited_model',
)

_DB_AUDIT = True


class AuditActionT(StrEnum):
    INSERT = 'insert'
    UPDATE = 'update'
    DELETE = 'delete'


class AuditAuthorField(BaseModel):
    id: PydanticObjectId
    name: str
    email: str


class AuditRecord(Document):
    class Settings:
        name = 'audits'

    collection: str = Indexed(str)
    object_id: PydanticObjectId = Indexed(PydanticObjectId)
    action: str
    next_revision: UUID | None
    revision: UUID | None
    author: AuditAuthorField | None
    time: datetime

    __data: dict | None = None

    @property
    def data(self) -> dict | None:
        return self.__data

    @classmethod
    def create_record(
        cls,
        collection: str,
        object_id: PydanticObjectId,
        next_revision: UUID | None,
        revision: UUID | None,
        action: AuditActionT,
        data: dict,
    ) -> Self:
        author: AuditAuthorField | None = None
        try:
            if user_ctx := context.get('current_user'):
                author = AuditAuthorField(
                    id=user_ctx.user.id,
                    name=user_ctx.user.name,
                    email=user_ctx.user.email,
                )
        except ContextDoesNotExistError:
            pass
        obj = cls(
            collection=collection,
            object_id=object_id,
            next_revision=next_revision,
            revision=revision,
            action=str(action),
            author=author,
            time=utcnow(),
        )
        obj.__data = data  # pylint: disable=unused-private-member
        return obj

    async def _save_data(self, path: str) -> None:
        await aio_os.makedirs(opd(path), exist_ok=True)
        async with aiofiles.open(path, 'wb') as f:
            await f.write(
                bson.encode(
                    {
                        **self.model_dump(mode='json'),
                        'data': self.__data,
                    }
                )
            )

    async def save_data(self) -> None:
        await self._save_data(self._data_path)

    async def _load_data(self, path: str) -> None:
        async with aiofiles.open(path, 'rb') as f:
            content = bson.decode(await f.read())
        if not (data := content.get('data')):
            raise ValueError('No data found in audit record')
        self.__data = data

    async def load_data(self) -> None:
        await self._load_data(self._data_path)

    @property
    def _data_path(self) -> str:
        return opj(
            CONFIG.AUDIT_STORAGE_DIR,
            self.collection,
            str(self.object_id),
            f'{self.revision}.bson',
        )


@after_event(Insert)
async def _after_insert_callback(self: Document) -> None:
    obj = AuditRecord.create_record(
        collection=self.__class__.Settings.name,
        object_id=self.id,
        next_revision=self.revision_id,
        revision=None,
        action=AuditActionT.INSERT,
        data={},
    )
    await AuditRecord.insert_one(obj)
    await obj.save_data()


@before_event(Delete)
async def _before_delete_callback(self: Document) -> None:
    obj = AuditRecord.create_record(
        collection=self.__class__.Settings.name,
        object_id=self.id,
        next_revision=None,
        revision=self.revision_id,
        action=AuditActionT.DELETE,
        data=self.get_saved_state(),
    )
    await AuditRecord.insert_one(obj)
    await obj.save_data()


@before_event(SaveChanges)
async def _before_update_callback(self: Document) -> None:
    # pylint: disable=protected-access
    self.__prev_revision_id = self.revision_id


@after_event(SaveChanges)
async def _after_update_callback(self: Document) -> None:
    # pylint: disable=protected-access
    obj = AuditRecord.create_record(
        collection=self.__class__.Settings.name,
        object_id=self.id,
        next_revision=self.revision_id,
        revision=self.__prev_revision_id,
        action=AuditActionT.UPDATE,
        data=self.get_previous_saved_state(),
    )
    await AuditRecord.insert_one(obj)
    await obj.save_data()


@before_event(Replace)
async def _before_replace_callback(self: Document) -> None:
    # pylint: disable=protected-access
    self.__prev_revision_id = self.revision_id


@after_event(Replace)
async def _after_replace_callback(self: Document) -> None:
    # pylint: disable=protected-access
    obj = AuditRecord.create_record(
        collection=self.__class__.Settings.name,
        object_id=self.id,
        next_revision=self.revision_id,
        revision=self.__prev_revision_id,
        action=AuditActionT.UPDATE,
        data=self.get_previous_saved_state(),
    )
    await AuditRecord.insert_one(obj)
    await obj.save_data()


AuditedTypeVar = TypeVar('AuditedTypeVar', bound=Document)


def audited_model(cls: type[AuditedTypeVar]) -> type[AuditedTypeVar]:
    # pylint: disable=protected-access
    if not _DB_AUDIT:
        return cls
    cls._after_insert_callback = _after_insert_callback
    cls._before_delete_callback = _before_delete_callback
    cls._before_update_callback = _before_update_callback
    cls._after_update_callback = _after_update_callback
    cls._before_replace_callback = _before_replace_callback
    cls._after_replace_callback = _after_replace_callback
    return cls

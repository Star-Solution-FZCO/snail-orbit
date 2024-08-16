from datetime import datetime
from enum import StrEnum
from typing import Self, TypeVar
from uuid import UUID

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

from pm.utils.dateutils import utcnow

__all__ = (
    'AuditRecord',
    'AuditAuthorField',
    'audited_model',
)


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
    data: dict

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
            if user := context.get('current_user'):
                author = AuditAuthorField(
                    id=user.id,
                    name=user.name,
                    email=user.email,
                )
        except ContextDoesNotExistError:
            pass
        return cls(
            collection=collection,
            object_id=object_id,
            next_revision=next_revision,
            revision=revision,
            action=str(action),
            author=author,
            time=utcnow(),
            data=data,
        )


@after_event(Insert)
async def _after_insert_callback(self: Document) -> None:
    await AuditRecord.insert_one(
        AuditRecord.create_record(
            collection=self.__class__.Settings.name,
            object_id=self.id,
            next_revision=self.revision_id,
            revision=None,
            action=AuditActionT.INSERT,
            data={},
        )
    )


@before_event(Delete)
async def _before_delete_callback(self: Document) -> None:
    await AuditRecord.insert_one(
        AuditRecord.create_record(
            collection=self.__class__.Settings.name,
            object_id=self.id,
            next_revision=None,
            revision=self.revision_id,
            action=AuditActionT.DELETE,
            data=self.get_saved_state(),
        )
    )


@before_event(SaveChanges)
async def _before_update_callback(self: Document) -> None:
    self.__prev_revision_id = self.revision_id


@after_event(SaveChanges)
async def _after_update_callback(self: Document) -> None:
    await AuditRecord.insert_one(
        AuditRecord.create_record(
            collection=self.__class__.Settings.name,
            object_id=self.id,
            next_revision=self.revision_id,
            revision=self.__prev_revision_id,
            action=AuditActionT.UPDATE,
            data=self.get_previous_saved_state(),
        )
    )


@before_event(Replace)
async def _before_replace_callback(self: Document) -> None:
    self.__prev_revision_id = self.revision_id


@after_event(Replace)
async def _after_replace_callback(self: Document) -> None:
    await AuditRecord.insert_one(
        AuditRecord.create_record(
            collection=self.__class__.Settings.name,
            object_id=self.id,
            next_revision=self.revision_id,
            revision=self.__prev_revision_id,
            action=AuditActionT.UPDATE,
            data=self.get_previous_saved_state(),
        )
    )


AuditedTypeVar = TypeVar('AuditedTypeVar', bound=Document)


def audited_model(cls: type[AuditedTypeVar]) -> type[AuditedTypeVar]:
    cls._after_insert_callback = _after_insert_callback
    cls._before_delete_callback = _before_delete_callback
    cls._before_update_callback = _before_update_callback
    cls._after_update_callback = _after_update_callback
    cls._before_replace_callback = _before_replace_callback
    cls._after_replace_callback = _after_replace_callback
    return cls

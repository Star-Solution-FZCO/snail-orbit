import datetime
import pickle
import typing as t
import warnings
from typing import Any, Self

import sqlalchemy
from sqlalchemy import DateTime, Table, and_, event, inspect, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import AttributeState, Mapped, Mapper, PassiveFlag, mapped_column
from sqlalchemy.sql.elements import SQLCoreOperations

from ._declarative_base import Base
from .audit import AuditActions, AuditRecord
from .db import async_session, autocommit_async_session
from .utils import get_utc

if t.TYPE_CHECKING:
    from collections.abc import Buffer  # noqa: F401

__all__ = ('BaseModel',)


class BaseModel(Base):
    """
    The `BaseModel` class is an abstract base class that provides common functionality for models in a database.

    Attributes:
    -----------
    - `__abstract__`: A boolean flag indicating if the class is an abstract base class.
    - `__audit_comment`: A string representing an audit comment for the instance.
    - `id`: An integer representing the primary key of the model.
    - `revision`: An integer representing the revision number of the model.
    - `created`: A `datetime.datetime` object representing the date and time when the model was created.
    - `updated`: A `datetime.datetime` object representing the date and time when the model was last updated.

    Methods:
    --------
    - `audit_comment(self) -> str | None`: Gets and removes the audit comment for the instance.
    - `audit_comment(self, value: str) -> None`: Sets the audit comment for the instance.
    - `_up_revision(self) -> None`: Increments the revision number by 1.
    - `save(self, session: AsyncSession | None = None, refresh: bool = False) -> Self`: Saves the current instance of the object.
    - `delete(self, session: AsyncSession | None = None) -> None`: Deletes the current object from the database.
    - `sa_refresh(self, session: AsyncSession | None = None) -> None`: Refreshes the current object within the specified session.
    - `rollback(self, revision: int | None = None, session: AsyncSession | None = None) -> None`: Rolls back the model to a specific revision.
    - `audits(self, session: AsyncSession | None = None, limit: int = 100) -> list[AuditRecord]`: Retrieves audit records for the model.
    - `__repr__(self) -> str`: Returns a string representation of the model.

    Example Usage:
    --------------
    ```python
    class User(BaseModel):
        __tablename__ = 'users'

        name: Mapped[str] = mapped_column(String)
        email: Mapped[str] = mapped_column(String)
        age: Mapped[int] = mapped_column(Integer)
    ```
    """

    __abstract__ = True
    __audit_comment: str | None
    __read_only_fields__: tuple[str, ...] = tuple()
    id: Mapped[int] = mapped_column(primary_key=True)
    revision: Mapped[int] = mapped_column(default=0)
    created: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), default=get_utc
    )
    updated: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), default=get_utc, onupdate=get_utc
    )

    def __init__(self, *args: t.Any, **kwargs: t.Any) -> None:
        super().__init__(**kwargs)

    @property
    def audit_comment(self) -> str | None:
        """Get and remove the audit comment.

        :return: The audit comment if it exists, otherwise None.
        """
        msg: str | None = getattr(self, '__audit_comment', None)
        if msg is not None:
            delattr(self, '__audit_comment')
        return msg

    @audit_comment.setter
    def audit_comment(self, value: str) -> None:
        """
        Sets the audit comment for the instance.

        :param value: The audit comment to be set.
        :type value: str
        :return: None
        :rtype: None

        """
        setattr(self, '__audit_comment', value)

    def _up_revision(self) -> None:
        """
        Increments the revision number by 1.

        :return: None
        """
        self.revision += 1  # type: ignore

    async def save(self, session: AsyncSession | None = None) -> Self:
        """
        Save Method
        ====================

        Saves the current instance of the object.

        :param session: An optional `AsyncSession` object to be used for the save operation.
        :return: None

        Example Usage:
        --------------
        ```
        async def save(self, session: AsyncSession | None = None) -> Self:
            async with with_commit(session) as ses:
                ses.add(self)
        ```

        """
        async with autocommit_async_session(session) as s:
            s.add(self)
        return self

    async def delete(self, session: AsyncSession | None = None) -> None:
        """
        Delete the current object from the database.

        :param session: An optional AsyncSession object to use for the database session.
        :return: None
        """
        async with autocommit_async_session(session) as session:
            await session.delete(self)

    async def sa_refresh(self, session: AsyncSession | None = None) -> None:
        """
        :param session: An optional parameter specifying the `AsyncSession` to use. If not provided, a new `AsyncSession` will be created.
        :return: None

        The `sa_refresh` method refreshes the current object within the specified session. It uses the `with_session` context manager to handle the session
        and automatically refreshes the object using the session's `refresh` method.
        """
        async with async_session(session) as session:
            await session.refresh(self)

    async def rollback(
        self, revision: int | None = None, session: AsyncSession | None = None
    ) -> None:
        """
        :param revision: The revision number to which the model should be rolled back. If not specified, it will be set to the current revision minus 1.
        :param session: The asynchronous SQLAlchemy session to use for the rollback operation. If not specified, a new session will be created.
        :return: None

        """
        if revision is None:
            revision = t.cast(int, self.revision) - 1
        if self.revision == 0:
            raise ValueError('Cannot rollback a model with no revisions')
        if revision < 0:
            raise ValueError('Revision must be positive')
        if revision >= t.cast(int, self.revision):
            raise ValueError('Revision must be less than current revision')
        async with async_session(session) as s:
            await self.sa_refresh(s)
            state: Any = inspect(self)
            relationships = {}
            if state:
                # noinspection PyUnresolvedReferences
                relationships = {r.key: r.direction for r in state.mapper.relationships}
            for record in await self.audits(
                s, limit=t.cast(int, self.revision) - revision
            ):
                if record is None:
                    raise ValueError('Audit record not found')
                data = pickle.loads(t.cast('Buffer', record.data))

                for key, action in data.items():
                    if key in relationships:
                        for add in action['deleted']:
                            for mapper in Base.registry.mappers:
                                if not isinstance(mapper.persist_selectable, Table):
                                    continue
                                if mapper.persist_selectable.key == add['table']:
                                    item = await s.scalar(
                                        select(mapper.class_).where(
                                            t.cast(
                                                SQLCoreOperations[Any],
                                                getattr(mapper.class_, add['fk']),
                                            )
                                            == add['value']
                                        )
                                    )
                                    if not item:
                                        raise ValueError(f'Item not found for {add}')
                                    getattr(self, key).append(item)
                        for delete in action['added']:
                            if not isinstance(delete, dict):
                                raise ValueError(
                                    f'Invalid data, expected dict for key {key}, got {type(delete)}'
                                )
                            for item in getattr(self, key):
                                if getattr(item, delete['fk']) == delete['value']:
                                    getattr(self, key).remove(item)
                        continue
                    try:
                        value = action['deleted'][0]
                    except IndexError:
                        value = action['added'][0]
                    if key in ['created', 'updated', 'revision', 'id']:
                        continue
                    setattr(self, key, value)
            self.audit_comment = 'rollback to revision %d' % revision
            s.add(self)
            await s.commit()

    async def audits(
        self, session: AsyncSession | None = None, limit: int = 100
    ) -> list[AuditRecord]:
        async with async_session(session) as s:
            q = await s.scalars(
                select(AuditRecord)
                .where(
                    and_(
                        t.cast(
                            SQLCoreOperations[Any],
                            AuditRecord.table_name
                            == t.cast(Table, t.cast(Any, self).__table__).key,
                        ),
                        t.cast(
                            SQLCoreOperations[Any], AuditRecord.object_id == self.id
                        ),
                    )
                )
                .limit(limit)
                .order_by(AuditRecord.id.desc())
            )
            return t.cast(list[AuditRecord], q.all())

    def __repr__(self) -> str:
        kw = [
            (a.key, str(getattr(self, a.key)))
            for a in t.cast(t.Any, self).__table__.primary_key.columns
        ]
        return f'{self.__class__.__name__}({", ".join([f"{k}={v}" for k, v in kw])})'


@event.listens_for(BaseModel, 'before_update', propagate=True)
def receive_before_update(
    mapper: Mapper[BaseModel], __: sqlalchemy.engine.Connection, target: BaseModel
) -> None:
    """
    :param mapper: The SQLAlchemy mapper object.
    :param __: The SQLAlchemy engine connection.
    :param target: The target SQLAlchemy model instance.
    :return: None

    This method is an event listener triggered before an update operation is performed on a SQLAlchemy model. It receives three parameters: `mapper`,
    `__`, and `target`. The `mapper` parameter is the SQLAlchemy mapper object associated with the model being updated. The `__` parameter is the SQLAlchemy
    engine connection. The `target` parameter is the instance of the model being updated.

    Inside the method, it first casts the `target` parameter to `sqlalchemy.orm.InstanceState` to access the state of the model instance. Then,
    it iterates over the attributes of the `mapper` to check if any attribute has changes. If changes are detected, the method calls the `_up_revision()`
    method on the `target` instance.

    Note: This method is decorated with `@event.listens_for` to make it an event listener for the 'before_update' event on the `BaseModel` class.

    Example usage:
    receive_before_update(mapper, __, target)
    """
    state = t.cast(sqlalchemy.orm.InstanceState[BaseModel], sqlalchemy.inspect(target))
    for a in t.cast(t.Iterable[AttributeState], mapper.attrs):
        if state.get_history(a.key, PassiveFlag.NO_CHANGE).has_changes():
            target._up_revision()
            break


@event.listens_for(BaseModel, 'after_insert', propagate=True)
def receive_after_insert(
    mapper: Mapper[BaseModel],
    connection: sqlalchemy.engine.Connection,
    target: BaseModel,
) -> None:
    """
    Receive and handle the event triggered after an object is inserted into the database.

    :param mapper: The mapper representing the model class.
    :type mapper: sqlalchemy.orm.Mapper[BaseModel]
    :param connection: The connection used for the database operation.
    :type connection: sqlalchemy.engine.Connection
    :param target: The object being inserted into the database.
    :type target: BaseModel
    :return: None

    .. note::
       This method is registered as an event listener using SQLAlchemy's `after_insert` event.

    .. seealso::
       - `AuditRecord.create_entry` method for creating an audit record entry.
       - `AuditActions.INSERT` for the "insert" action.
    """
    AuditRecord.create_entry(target, mapper, AuditActions.INSERT, connection)


@event.listens_for(BaseModel, 'after_update', propagate=True)
def receive_after_update(
    mapper: Mapper[BaseModel],
    connection: sqlalchemy.engine.Connection,
    target: BaseModel,
) -> None:
    """
    :param mapper: the mapper of the updated model
    :type mapper: sqlalchemy.orm.Mapper[BaseModel]
    :param connection: the connection object used for the update operation
    :type connection: sqlalchemy.engine.Connection
    :param target: the updated model instance
    :type target: BaseModel
    :return: None
    """
    if target.__read_only_fields__:
        if state := t.cast(Any, inspect(target)):
            for field_name in target.__read_only_fields__:
                if not hasattr(target, field_name):
                    warnings.warn(f'field {field_name} not found')
                    continue
                changed, _, deleted = state.get_history(
                    field_name, PassiveFlag.NO_CHANGE
                )
                if changed or deleted:
                    raise ValueError(f'field {field_name} is read only')
    AuditRecord.create_entry(target, mapper, AuditActions.UPDATE, connection)


@event.listens_for(BaseModel, 'after_delete', propagate=True)
def receive_after_delete(
    mapper: Mapper[BaseModel],
    connection: sqlalchemy.engine.Connection,
    target: BaseModel,
) -> None:
    """
    Handle the 'after_delete' event for Base Model objects.

    :param mapper: The SQLAlchemy mapper for the object being deleted.
    :type mapper: sqlalchemy.orm.mapper.Mapper

    :param connection: The SQLAlchemy database connection.
    :type connection: sqlalchemy.engine.Connection

    :param target: The Base Model object being deleted.
    :type target: BaseModel

    :return: None
    """
    AuditRecord.create_entry(target, mapper, AuditActions.DELETE, connection)

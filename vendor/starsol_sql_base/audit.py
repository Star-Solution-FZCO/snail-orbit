import json
import pickle
import typing as t
from datetime import date, datetime
from enum import IntEnum
from json import JSONEncoder

import sqlalchemy
from sqlalchemy import DateTime, event, ForeignKey, insert, JSON, LargeBinary, Table
from sqlalchemy.orm import AppenderQuery, InstanceState, mapped_column, Mapper, MapperProperty, RelationshipProperty, Session
from sqlalchemy.orm.base import MANYTOMANY, Mapped, PassiveFlag, RelationshipDirection

from ._declarative_base import Base
from .utils import get_utc

if t.TYPE_CHECKING:
    from .base import BaseModel
__all__ = ('AuditActions', 'AuditRecord')

BLACKLISTED_CLASSES: tuple[str, ...] = tuple()


class AuditActions(IntEnum):
    INSERT = 1
    UPDATE = 2
    DELETE = 3


class AuditFieldActions(IntEnum):
    ADD = 1
    REMOVE = 2
    CHANGE = 3


def history_record(added: list | tuple | None = None, deleted: list | tuple | None = None) -> dict[str, tuple | list]:
    if added is None:
        added = []
    if deleted is None:
        deleted = []
    return {'added': added, 'deleted': deleted}


def find_foreign_key(foreign_keys: set[ForeignKey]) -> dict[str, dict[str, t.Any]]:
    result = {}
    for foreign_key in foreign_keys:
        result[foreign_key.column.key] = {'table': foreign_key.column.table.key, 'fk': foreign_key.column.key}
    return result


def relation_record(fk: str, item: 'Base') -> dict[str, t.Any]:
    return {
        '__relation': True,
        'fk': str(fk),
        'table': t.cast(Table, t.cast(t.Any, item.__table__)).name,  # type: ignore
        'value': getattr(item, fk),
        'string': str(item),
    }


def resolve_foreign_keys(foreign_keys: dict[str, dict[str, t.Any]], items: t.Iterable[Base]) -> tuple[list[dict[str, t.Any]], set[str]]:
    result = []
    resolve_after_commit = set()
    for item in items:
        for key, meta in foreign_keys.items():
            value = getattr(item, key, None)
            if value is None:
                resolve_after_commit.add(key)
            result += [relation_record(key, item)]
    return result, resolve_after_commit


def find_remote_foreign_keys(
    attribute: MapperProperty, direction: RelationshipDirection, skip_table: list[str | Table] | None = None
) -> dict[str, dict[str, t.Any]]:
    if skip_table is None:
        skip_table = []
    pairs = attribute.local_remote_pairs
    for idx in range(len(pairs) - 1, -1, -1):
        left, right = pairs[idx]
        if direction == MANYTOMANY and right.table.name not in skip_table:
            return find_foreign_key(right.foreign_keys)
        return find_foreign_key(left.foreign_keys)
    raise ValueError('Can not detect PK')


def get_history(
    mapper: Mapper, state: InstanceState['BaseModel'], action: AuditActions
) -> dict[str, tuple[MapperProperty[t.Any], tuple[()] | list[t.Any], tuple[()] | list[t.Any], tuple[()] | list[t.Any], RelationshipDirection | None]]:
    result = {}
    for attr in t.cast(t.Iterable[MapperProperty], mapper.iterate_properties):
        history = state.get_history(attr.key, PassiveFlag.PASSIVE_OFF)
        added, deleted = history.added, history.deleted
        if not added and not deleted and action != AuditActions.DELETE:
            continue
        result[str(attr.key)] = (attr, added, deleted, history.unchanged, getattr(attr, 'direction', None))
    return result


def get_string_from_relation(relations: list[dict[str, t.Any]]) -> list[str]:
    return [i['string'] for i in relations if i is not None and 'string' in i]


class AuditRecord(Base):
    __tablename__ = 'audits'
    id: Mapped[int] = mapped_column(primary_key=True)
    object_id: Mapped[int] = mapped_column(index=True)
    object_revision: Mapped[int] = mapped_column(default=0)
    table_name: Mapped[str] = mapped_column(index=True)
    class_name: Mapped[str] = mapped_column(index=True)
    _fields: Mapped[str] = mapped_column(name='fields')
    json_data: Mapped[dict] = mapped_column(JSON(none_as_null=True))
    time: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc, index=True)
    user_id: Mapped[int] = mapped_column(index=True)
    user: Mapped[str] = mapped_column()
    ip: Mapped[str] = mapped_column()
    action: Mapped[str] = mapped_column()
    data: Mapped[bytes] = mapped_column(LargeBinary)
    comment: Mapped[str | None] = mapped_column()

    def __init__(self, fields: t.Iterable[str] | None = None, **kwargs: t.Any) -> None:
        if fields is not None:
            kwargs['_fields'] = ','.join(map(str.strip, fields))
        super().__init__(**kwargs)

    @property
    def fields(self) -> list[str]:
        return str.split(t.cast(str | None, self._fields) or '', ',')

    @fields.setter
    def fields(self, value: list[str]) -> None:
        self._fields = t.cast(Mapped[str], ','.join(map(str.strip, value)))

    @classmethod
    def create_entry(cls, target: 'BaseModel', mapper: Mapper['BaseModel'], action: AuditActions, connection: sqlalchemy.engine.Connection) -> None:
        if target.__class__.__name__ in BLACKLISTED_CLASSES:
            return
        state = t.cast(sqlalchemy.orm.InstanceState['BaseModel'], sqlalchemy.inspect(target))
        attr_history = get_history(mapper, state, action)
        if not attr_history and action == AuditActions.UPDATE:
            return
        if action == AuditActions.DELETE:
            for attribute in t.cast(t.Iterable[MapperProperty], mapper.iterate_properties):
                if attribute.key in attr_history:
                    continue
                attr_history[attribute.key] = (attribute, [], getattr(target, attribute.key), [], None)
        changes: dict = {}
        need_to_be_resolve: dict = {'added': {}, 'deleted': {}}
        for key, (attribute, added, deleted, unchanged, direction) in attr_history.items():
            if action == AuditActions.DELETE:
                deleted = unchanged
            if direction is None:
                changes[key] = history_record(added, deleted)
                continue
            added_: list[dict[str, dict[str, t.Any]]] = []
            if added:
                added_, need_to_resolve_added = resolve_foreign_keys(find_remote_foreign_keys(attribute, direction), added)
                if need_to_resolve_added:
                    need_to_be_resolve['added'][key] = need_to_resolve_added
            deleted_: list[dict[str, dict[str, t.Any]]] = []
            if deleted:
                deleted_, need_to_resolve_deleted = resolve_foreign_keys(find_remote_foreign_keys(attribute, direction), deleted)
                if need_to_resolve_deleted:
                    need_to_be_resolve['deleted'][key] = need_to_resolve_deleted
            changes[key] = history_record(added_, deleted_)
        if action == AuditActions.INSERT or action == AuditActions.DELETE:
            for attribute in t.cast(t.Iterable[MapperProperty['BaseModel']], mapper.iterate_properties):
                if attribute.key in changes:
                    continue
                key = 'added' if action == AuditActions.INSERT else 'deleted'
                value = getattr(target, attribute.key)
                if isinstance(value, AppenderQuery):
                    value = value.all()
                changes[attribute.key] = history_record(**{key: [value]})
        if any([*need_to_be_resolve['added'].values(), *need_to_be_resolve['deleted'].values()]):

            @event.listens_for(state.session, 'after_commit', once=True)
            def execute_after_commit(_: Session) -> None:
                with sync_session() as session:
                    for history_action, data in need_to_be_resolve.items():
                        if not data:
                            continue
                        for k, fks in data.items():
                            changes[k][history_action] = []
                            for item in getattr(target, k):
                                for fk in fks:
                                    changes[k][history_action] += [relation_record(fk, item)]
                            session.execute(cls.create_insert(target, changes, action, mapper))
                            session.commit()

            return None
        connection.execute(cls.create_insert(target, changes, action, mapper, comment=target.audit_comment))

    def __repr__(self) -> str:
        return (
            f'AuditRecord(id={self.id}, object_id={self.object_id}, table_name="{self.table_name}", class_name="{self.class_name}", date='
            f'{self.time}, ip="{self.ip}", fields={self.fields}, action="{self.action}")'
        )

    @classmethod
    def create_insert(
        cls, target: 'BaseModel', changes: dict[str, dict[str, list[t.Any]]], action: AuditActions, mapper: Mapper['BaseModel'], comment: str | None = None
    ) -> sqlalchemy.sql.expression.Insert:
        json_data: dict[str, dict[str, t.Any]] = {}
        data: dict[str, t.Any] = {}
        relation_pairs: dict[str, str] = {}
        many_to_many: list[str] = []
        for relation in t.cast(t.Iterable[RelationshipProperty['BaseModel']], mapper.relationships):
            if relation.direction == RelationshipDirection.MANYTOMANY:
                many_to_many.append(relation.key)
                continue
            for pair in relation.synchronize_pairs:
                for column in pair:
                    if column.table.key not in relation_pairs and column.key is not None:
                        relation_pairs[relation.key] = column.key
        for key, value in changes.items():
            if key not in relation_pairs.values():
                if key in many_to_many:
                    json_data[key] = history_record(get_string_from_relation(value['added']), get_string_from_relation(value['deleted']))
                else:
                    json_data[key] = value
            if key in relation_pairs:
                continue
            data[key] = {'added': [], 'deleted': []}
            for k, v in value.items():
                data[key][k] = v
        json_data = json.loads(json.dumps(json_data, cls=AuditEncoder))
        return insert(t.cast(Table, AuditRecord.__table__)).values(  # type: ignore
            dict(
                object_id=target.id,
                object_revision=target.revision,
                table_name=t.cast(Table, t.cast(t.Any, target).__table__).name,
                class_name=target.__class__.__name__,
                fields=','.join(sorted(map(str.strip, changes))),
                user_id=-1,
                user='CLI',
                ip='127.0.0.1',
                action=action.name,
                json_data=json_data,
                data=pickle.dumps(data, protocol=pickle.HIGHEST_PROTOCOL),
                comment=comment,
            )
        )


class AuditEncoder(JSONEncoder):
    def default(self, o: object) -> t.Any:
        if isinstance(o, (int, float, str, bool, type(None))):
            return o
        if isinstance(o, datetime):
            return o.isoformat()
        if isinstance(o, date):
            return o.isoformat()
        return super().default(o)

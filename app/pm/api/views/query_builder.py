from datetime import date, datetime
from enum import StrEnum
from typing import Annotated, Any, Literal, Self

from pydantic import BaseModel, Field, RootModel, model_validator

import pm.models as m
from pm.api.views.custom_fields import ShortOptionOutput
from pm.api.views.project import ProjectShortOutput
from pm.api.views.user import UserOutput
from pm.models.tag import TagLinkField

__all__ = (
    'AvailableFieldRootModel',
    'ParsedQueryObjectRootModel',
    'QueryBuilderInput',
    'QueryBuilderOutput',
    'QueryFieldTypeT',
)


class QueryFieldTypeT(StrEnum):
    STRING = m.CustomFieldTypeT.STRING
    INTEGER = m.CustomFieldTypeT.INTEGER
    FLOAT = m.CustomFieldTypeT.FLOAT
    BOOLEAN = m.CustomFieldTypeT.BOOLEAN
    DATE = m.CustomFieldTypeT.DATE
    DATETIME = m.CustomFieldTypeT.DATETIME
    DURATION = m.CustomFieldTypeT.DURATION
    ENUM = m.CustomFieldTypeT.ENUM
    ENUM_MULTI = m.CustomFieldTypeT.ENUM_MULTI
    STATE = m.CustomFieldTypeT.STATE
    VERSION = m.CustomFieldTypeT.VERSION
    VERSION_MULTI = m.CustomFieldTypeT.VERSION_MULTI
    USER = m.CustomFieldTypeT.USER
    USER_MULTI = m.CustomFieldTypeT.USER_MULTI
    OWNED = m.CustomFieldTypeT.OWNED
    OWNED_MULTI = m.CustomFieldTypeT.OWNED_MULTI

    PROJECT = 'project'
    HASHTAG = 'hashtag'
    TAG = 'tag'


class BaseAvailableField(BaseModel):
    type: QueryFieldTypeT = Field(description='Field type for discrimination')
    name: str = Field(description='Field name')


class BaseParsedObject(BaseModel):
    type: QueryFieldTypeT = Field(description='Field type for discrimination')
    name: str = Field(description='Field name')
    value: Any = Field(description='Field value')


class CustomFieldGroupAvailable(BaseAvailableField):
    gid: str | None = Field(
        description='Custom field group identifier (null for reserved fields)'
    )


class ProjectFieldAvailable(BaseAvailableField):
    type: Literal[QueryFieldTypeT.PROJECT] = QueryFieldTypeT.PROJECT


class HashtagFieldAvailable(BaseAvailableField):
    type: Literal[QueryFieldTypeT.HASHTAG] = QueryFieldTypeT.HASHTAG


class TagFieldAvailable(BaseAvailableField):
    type: Literal[QueryFieldTypeT.TAG] = QueryFieldTypeT.TAG


class StringCustomFieldAvailable(CustomFieldGroupAvailable):
    type: Literal[QueryFieldTypeT.STRING] = QueryFieldTypeT.STRING


class IntegerCustomFieldAvailable(CustomFieldGroupAvailable):
    type: Literal[QueryFieldTypeT.INTEGER] = QueryFieldTypeT.INTEGER


class FloatCustomFieldAvailable(CustomFieldGroupAvailable):
    type: Literal[QueryFieldTypeT.FLOAT] = QueryFieldTypeT.FLOAT


class BooleanCustomFieldAvailable(CustomFieldGroupAvailable):
    type: Literal[QueryFieldTypeT.BOOLEAN] = QueryFieldTypeT.BOOLEAN


class DateCustomFieldAvailable(CustomFieldGroupAvailable):
    type: Literal[QueryFieldTypeT.DATE] = QueryFieldTypeT.DATE


class DateTimeCustomFieldAvailable(CustomFieldGroupAvailable):
    type: Literal[QueryFieldTypeT.DATETIME] = QueryFieldTypeT.DATETIME


class DurationCustomFieldAvailable(CustomFieldGroupAvailable):
    type: Literal[QueryFieldTypeT.DURATION] = QueryFieldTypeT.DURATION


class EnumCustomFieldAvailable(CustomFieldGroupAvailable):
    type: Literal[QueryFieldTypeT.ENUM] = QueryFieldTypeT.ENUM


class EnumMultiCustomFieldAvailable(CustomFieldGroupAvailable):
    type: Literal[QueryFieldTypeT.ENUM_MULTI] = QueryFieldTypeT.ENUM_MULTI


class StateCustomFieldAvailable(CustomFieldGroupAvailable):
    type: Literal[QueryFieldTypeT.STATE] = QueryFieldTypeT.STATE


class VersionCustomFieldAvailable(CustomFieldGroupAvailable):
    type: Literal[QueryFieldTypeT.VERSION] = QueryFieldTypeT.VERSION


class VersionMultiCustomFieldAvailable(CustomFieldGroupAvailable):
    type: Literal[QueryFieldTypeT.VERSION_MULTI] = QueryFieldTypeT.VERSION_MULTI


class UserCustomFieldAvailable(CustomFieldGroupAvailable):
    type: Literal[QueryFieldTypeT.USER] = QueryFieldTypeT.USER


class UserMultiCustomFieldAvailable(CustomFieldGroupAvailable):
    type: Literal[QueryFieldTypeT.USER_MULTI] = QueryFieldTypeT.USER_MULTI


class OwnedCustomFieldAvailable(CustomFieldGroupAvailable):
    type: Literal[QueryFieldTypeT.OWNED] = QueryFieldTypeT.OWNED


class OwnedMultiCustomFieldAvailable(CustomFieldGroupAvailable):
    type: Literal[QueryFieldTypeT.OWNED_MULTI] = QueryFieldTypeT.OWNED_MULTI


class CustomFieldGroupParsed(BaseParsedObject):
    gid: str | None = Field(
        description='Custom field group identifier (null for reserved fields)'
    )


class ProjectFieldParsed(BaseParsedObject):
    type: Literal[QueryFieldTypeT.PROJECT] = QueryFieldTypeT.PROJECT
    value: ProjectShortOutput | None


class HashtagFieldParsed(BaseParsedObject):
    type: Literal[QueryFieldTypeT.HASHTAG] = QueryFieldTypeT.HASHTAG
    value: str | None


class TagFieldParsed(BaseParsedObject):
    type: Literal[QueryFieldTypeT.TAG] = QueryFieldTypeT.TAG
    value: TagLinkField | None


class StringCustomFieldParsed(CustomFieldGroupParsed):
    type: Literal[QueryFieldTypeT.STRING] = QueryFieldTypeT.STRING
    value: str | None


class IntegerCustomFieldParsed(CustomFieldGroupParsed):
    type: Literal[QueryFieldTypeT.INTEGER] = QueryFieldTypeT.INTEGER
    value: int | None


class FloatCustomFieldParsed(CustomFieldGroupParsed):
    type: Literal[QueryFieldTypeT.FLOAT] = QueryFieldTypeT.FLOAT
    value: float | None


class BooleanCustomFieldParsed(CustomFieldGroupParsed):
    type: Literal[QueryFieldTypeT.BOOLEAN] = QueryFieldTypeT.BOOLEAN
    value: bool | None


class DateCustomFieldParsed(CustomFieldGroupParsed):
    type: Literal[QueryFieldTypeT.DATE] = QueryFieldTypeT.DATE
    value: date | None


class DateTimeCustomFieldParsed(CustomFieldGroupParsed):
    type: Literal[QueryFieldTypeT.DATETIME] = QueryFieldTypeT.DATETIME
    value: datetime | None


class DurationCustomFieldParsed(CustomFieldGroupParsed):
    type: Literal[QueryFieldTypeT.DURATION] = QueryFieldTypeT.DURATION
    value: int | None


class EnumCustomFieldParsed(CustomFieldGroupParsed):
    type: Literal[QueryFieldTypeT.ENUM] = QueryFieldTypeT.ENUM
    value: ShortOptionOutput | None


class EnumMultiCustomFieldParsed(CustomFieldGroupParsed):
    type: Literal[QueryFieldTypeT.ENUM_MULTI] = QueryFieldTypeT.ENUM_MULTI
    value: ShortOptionOutput | None


class StateCustomFieldParsed(CustomFieldGroupParsed):
    type: Literal[QueryFieldTypeT.STATE] = QueryFieldTypeT.STATE
    value: ShortOptionOutput | None


class VersionCustomFieldParsed(CustomFieldGroupParsed):
    type: Literal[QueryFieldTypeT.VERSION] = QueryFieldTypeT.VERSION
    value: ShortOptionOutput | None


class VersionMultiCustomFieldParsed(CustomFieldGroupParsed):
    type: Literal[QueryFieldTypeT.VERSION_MULTI] = QueryFieldTypeT.VERSION_MULTI
    value: ShortOptionOutput | None


class UserCustomFieldParsed(CustomFieldGroupParsed):
    type: Literal[QueryFieldTypeT.USER] = QueryFieldTypeT.USER
    value: UserOutput | None


class UserMultiCustomFieldParsed(CustomFieldGroupParsed):
    type: Literal[QueryFieldTypeT.USER_MULTI] = QueryFieldTypeT.USER_MULTI
    value: UserOutput | None


class OwnedCustomFieldParsed(CustomFieldGroupParsed):
    type: Literal[QueryFieldTypeT.OWNED] = QueryFieldTypeT.OWNED
    value: ShortOptionOutput | None


class OwnedMultiCustomFieldParsed(CustomFieldGroupParsed):
    type: Literal[QueryFieldTypeT.OWNED_MULTI] = QueryFieldTypeT.OWNED_MULTI
    value: ShortOptionOutput | None


AvailableFieldRootModel = RootModel[
    Annotated[
        (
            StringCustomFieldAvailable
            | IntegerCustomFieldAvailable
            | FloatCustomFieldAvailable
            | BooleanCustomFieldAvailable
            | DateCustomFieldAvailable
            | DateTimeCustomFieldAvailable
            | DurationCustomFieldAvailable
            | EnumCustomFieldAvailable
            | EnumMultiCustomFieldAvailable
            | StateCustomFieldAvailable
            | VersionCustomFieldAvailable
            | VersionMultiCustomFieldAvailable
            | UserCustomFieldAvailable
            | UserMultiCustomFieldAvailable
            | OwnedCustomFieldAvailable
            | OwnedMultiCustomFieldAvailable
            | ProjectFieldAvailable
            | HashtagFieldAvailable
            | TagFieldAvailable
        ),
        Field(discriminator='type'),
    ]
]


ParsedQueryObjectRootModel = RootModel[
    Annotated[
        (
            StringCustomFieldParsed
            | IntegerCustomFieldParsed
            | FloatCustomFieldParsed
            | BooleanCustomFieldParsed
            | DateCustomFieldParsed
            | DateTimeCustomFieldParsed
            | DurationCustomFieldParsed
            | EnumCustomFieldParsed
            | EnumMultiCustomFieldParsed
            | StateCustomFieldParsed
            | VersionCustomFieldParsed
            | VersionMultiCustomFieldParsed
            | UserCustomFieldParsed
            | UserMultiCustomFieldParsed
            | OwnedCustomFieldParsed
            | OwnedMultiCustomFieldParsed
            | ProjectFieldParsed
            | HashtagFieldParsed
            | TagFieldParsed
        ),
        Field(discriminator='type'),
    ]
]


class QueryBuilderInput(BaseModel):
    query: str | None = Field(
        default=None, description='Query string to parse (parse mode)'
    )
    filters: list[dict[str, Any]] | None = Field(
        default=None, description='Filter objects to build query from (build mode)'
    )

    @model_validator(mode='after')
    def validate_exactly_one_of_query_or_filters(self) -> Self:
        """Validate that exactly one of query or filters is provided."""
        if (self.query is None) == (self.filters is None):
            raise ValueError('Exactly one of query or filters must be provided')
        return self

    @property
    def is_parse_mode(self) -> bool:
        """True if parsing query to objects, False if building query from objects."""
        return self.query is not None

    @property
    def is_build_mode(self) -> bool:
        """True if building query from objects, False if parsing query to objects."""
        return self.filters is not None


class QueryBuilderOutput(BaseModel):
    query: str = Field(description='Original query string')
    filters: list[ParsedQueryObjectRootModel] = Field(
        description='Fields currently in query with their values',
    )
    available_fields: list[AvailableFieldRootModel] = Field(
        description='All queryable fields (using gid for custom fields)',
    )

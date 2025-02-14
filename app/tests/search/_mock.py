from typing import TYPE_CHECKING

from pydantic import BaseModel

if TYPE_CHECKING:
    from pm.models import CustomFieldTypeT

__all__ = (
    'FakeCustomField',
    'FakeProject',
    'get_fake_custom_fields',
    'get_fake_projects',
)


class FakeProject(BaseModel):
    name: str


class FakeCustomField(BaseModel):
    name: str
    type: 'CustomFieldTypeT'
    is_nullable: bool


class FakeEnumOption(BaseModel):
    value: str


class FakeStateOption(BaseModel):
    value: str


class FakeVersionOption(BaseModel):
    value: str


class FakeEnumCustomField(FakeCustomField):
    options: list[FakeEnumOption]


class FakeStateCustomField(FakeCustomField):
    options: list[FakeStateOption]


class FakeVersionCustomField(FakeCustomField):
    options: list[FakeVersionOption]


def parse_dict_to_field(field: dict) -> FakeCustomField:
    from pm.models import CustomFieldTypeT

    if field['type'] == CustomFieldTypeT.ENUM:
        return FakeEnumCustomField(
            name=field['name'],
            type=field['type'],
            is_nullable=field['is_nullable'],
            options=[FakeEnumOption(value=option) for option in field['options']],
        )
    if field['type'] == CustomFieldTypeT.STATE:
        return FakeStateCustomField(
            name=field['name'],
            type=field['type'],
            is_nullable=field['is_nullable'],
            options=[FakeStateOption(value=option) for option in field['options']],
        )
    if field['type'] == CustomFieldTypeT.VERSION:
        return FakeVersionCustomField(
            name=field['name'],
            type=field['type'],
            is_nullable=field['is_nullable'],
            options=[FakeVersionOption(value=option) for option in field['options']],
        )
    return FakeCustomField(
        name=field['name'],
        type=field['type'],
        is_nullable=field['is_nullable'],
    )


def get_fake_custom_fields(
    fields: list[dict],
) -> dict[str, list[FakeCustomField]]:
    res = {}
    for field in fields:
        res.setdefault(field['name'].lower(), []).append(parse_dict_to_field(field))
    return res


def get_fake_projects(
    projects: list[str],
) -> dict[str, list[FakeProject]]:
    res = {}
    for project in projects:
        res.setdefault(project.lower(), []).append(FakeProject(name=project))
    return res

from pydantic import BaseModel

from pm.models import CustomFieldTypeT

__all__ = (
    'FakeCustomField',
    'get_fake_custom_fields',
)


class FakeCustomField(BaseModel):
    name: str
    type: CustomFieldTypeT
    is_nullable: bool


class FakeEnumField(BaseModel):
    value: str


class FakeStateField(BaseModel):
    state: str


class FakeEnumCustomField(FakeCustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.ENUM
    options: list[FakeEnumField]


class FakeStateCustomField(FakeCustomField):
    type: CustomFieldTypeT = CustomFieldTypeT.STATE
    options: list[FakeStateField]


def parse_dict_to_field(field: dict) -> FakeCustomField:
    if field['type'] == CustomFieldTypeT.ENUM:
        return FakeEnumCustomField(
            name=field['name'],
            type=field['type'],
            is_nullable=field['is_nullable'],
            options=[FakeEnumField(value=option) for option in field['options']],
        )
    if field['type'] == CustomFieldTypeT.STATE:
        return FakeStateCustomField(
            name=field['name'],
            type=field['type'],
            is_nullable=field['is_nullable'],
            options=[FakeStateField(state=option) for option in field['options']],
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
        res.setdefault(field['name'], []).append(parse_dict_to_field(field))
    return res

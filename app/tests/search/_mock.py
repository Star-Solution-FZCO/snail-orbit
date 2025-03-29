from typing import TYPE_CHECKING
from uuid import uuid4

from pydantic import BaseModel

if TYPE_CHECKING:
    from pm.models import CustomFieldTypeT

__all__ = (
    'FakeCustomField',
    'get_fake_custom_fields',
)


class FakeCustomField(BaseModel):
    name: str
    type: 'CustomFieldTypeT'
    gid: str


def parse_dict_to_field(field: dict) -> FakeCustomField:
    from pm.models import CustomFieldTypeT

    return FakeCustomField(
        name=field['name'],
        type=CustomFieldTypeT(field['type']),
        gid=field.get('gid', str(uuid4())),
    )


def get_fake_custom_fields(
    fields: list[dict],
) -> dict[str, list[FakeCustomField]]:
    res = {}
    for field in fields:
        res.setdefault(field['name'].lower(), []).append(parse_dict_to_field(field))
    return res

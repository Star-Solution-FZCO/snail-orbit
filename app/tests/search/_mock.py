from dataclasses import dataclass

from pm.models import CustomFieldTypeT

__all__ = (
    'FakeCustomField',
    'get_fake_custom_fields',
)


@dataclass
class FakeCustomField:
    name: str
    type: CustomFieldTypeT
    is_nullable: bool


def get_fake_custom_fields() -> dict[str, list[FakeCustomField]]:
    return {
        'State': [FakeCustomField('State', CustomFieldTypeT.STATE, True)],
        'Priority': [FakeCustomField('Priority', CustomFieldTypeT.ENUM, True)],
    }

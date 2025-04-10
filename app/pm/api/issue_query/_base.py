from typing import Any

import pm.models as m

__all__ = (
    'IssueQueryTransformError',
    'get_custom_fields',
)


class IssueQueryTransformError(Exception):
    message: str

    def __init__(self, message: str, *_: Any, **__: Any) -> None:
        self.message = message
        super().__init__(self.message)


async def get_custom_fields() -> dict[str, m.CustomFieldTypeT]:
    fields = (
        await m.CustomField.find(with_children=True)
        .aggregate(
            [
                {
                    '$group': {
                        '_id': '$name',
                        'type': {'$first': '$type'},
                    },
                },
            ]
        )
        .to_list()
    )
    return {field['_id'].lower(): m.CustomFieldTypeT(field['type']) for field in fields}

from http import HTTPStatus
from typing import Any

from fastapi import HTTPException

import pm.models as m

__all__ = ('validate_custom_fields_values',)


async def validate_custom_fields_values(
    fields: dict[str, Any],
    project: m.Project,
    issue: m.Issue | None = None,
    ignore_none_errors: bool = False,
) -> tuple[list[m.CustomFieldValueUnion], list[m.CustomFieldValidationError]]:
    project_fields = {f.name: f for f in project.custom_fields}
    issue_fields = {f.name: f for f in issue.fields} if issue else {}
    for f_name in fields:
        if f_name not in project_fields:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST,
                f'Field {f_name} is not allowed',
            )

    results = []
    errors: list[m.CustomFieldValidationError] = []
    for f in project.custom_fields:
        if f.name not in fields:
            issue_field_val = issue_fields.get(f.name)
            fields[f.name] = (
                issue_field_val.value if issue_field_val else f.default_value
            )
        try:
            val_ = await f.validate_value(fields[f.name])
        except m.CustomFieldCanBeNoneError as err:
            val_ = None
            if not ignore_none_errors:
                errors.append(err)
        except m.CustomFieldValidationError as err:
            val_ = err.value
            errors.append(err)
        results.append(
            m.get_cf_value_class(f.type)(
                id=f.id,
                gid=f.gid,
                name=f.name,
                type=f.type,
                value=val_,
            ),
        )
    return results, errors

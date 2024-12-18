from http import HTTPStatus
from typing import Any

from beanie import PydanticObjectId
from bson.errors import InvalidId
from fastapi import HTTPException
from pydantic import BaseModel

import pm.models as m
from pm.api.search.issue import (
    HASHTAG_VALUES,
    _get_custom_fields,
)
from pm.api.search.parse_logical_expression import tokenize_expression
from pm.api.utils.router import APIRouter
from pm.api.views.custom_fields import CustomFieldLinkOutput
from pm.api.views.output import SuccessPayloadOutput

__all__ = ('router',)


router = APIRouter(prefix='/filters')


class IssueFilterBody(BaseModel):
    field: str
    value: Any | None = None

    async def to_query(self) -> str:
        if self.field in HASHTAG_VALUES:
            return self.field
        if self.field in ('subject', 'text'):
            return f'{self.field}: "{self.value}"'
        if self.field == 'project':
            try:
                project_id = PydanticObjectId(self.value)
                project = await m.Project.find_one(m.Project.id == project_id)
                if not project:
                    raise HTTPException(
                        status_code=HTTPStatus.BAD_REQUEST,
                        detail=f'Project with id {project_id} not found',
                    )
                return f'project: {project.slug}'
            except InvalidId as err:
                raise HTTPException(
                    status_code=HTTPStatus.BAD_REQUEST,
                    detail=f'Invalid project id: {self.value}',
                ) from err
        if self.value is None:
            return f'{self.field}: null'
        try:
            user_id = PydanticObjectId(self.value)
            user = await m.User.find_one(m.User.id == user_id)
            if not user:
                raise HTTPException(
                    status_code=HTTPStatus.BAD_REQUEST,
                    detail=f'User with id {user_id} not found',
                )
            val = user.email
        except InvalidId:
            val = self.value
        return f'{self.field}: {val}'


class IssueFiltersToQueryBody(BaseModel):
    filters: list[IssueFilterBody]


class IssueFiltersToQueryOutput(BaseModel):
    query: str


class IssueFilterOutput(BaseModel):
    field: CustomFieldLinkOutput | str
    value: Any | None = None


class IssueQueryToFiltersBody(BaseModel):
    query: str


class IssueQueryToFiltersOutput(BaseModel):
    filters: list[IssueFilterOutput]


@router.post('/parse-query')
async def parse_search_query(
    body: IssueQueryToFiltersBody,
) -> SuccessPayloadOutput[IssueQueryToFiltersOutput]:
    tokens = tokenize_expression(body.query)
    if any(t[0] != 'and' for t in tokens[1::2]):
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST,
            detail='Only "and" operator allowed',
        )
    expressions = [t[0] for t in tokens[::2]]
    custom_fields = await _get_custom_fields()
    filters = []
    for expr in expressions:
        if expr in HASHTAG_VALUES:
            filters.append(IssueFilterOutput(field=expr))
            continue
        field_name, field_val = expr.split(':', 1)
        field_name = field_name.strip().lower()
        field_val = field_val.strip().strip('"')
        if field_name in ('subject', 'text'):
            filters.append(IssueFilterOutput(field=field_name, value=field_val))
            continue
        if field_name == 'project':
            project = await m.Project.find_one(m.Project.slug == field_val)
            if not project:
                raise HTTPException(
                    status_code=HTTPStatus.BAD_REQUEST,
                    detail=f'Project with slug {field_val} not found',
                )
            filters.append(
                IssueFilterOutput(
                    field='project', value=m.ProjectLinkField.from_obj(project)
                )
            )
            continue
        if field_name not in custom_fields:
            raise HTTPException(
                status_code=HTTPStatus.BAD_REQUEST,
                detail=f'Custom field "{field_name}" not found',
            )
        field = custom_fields[field_name][0]
        try:
            val = await _transform_val(field, field_val)
        except m.CustomFieldValidationError as err:
            raise HTTPException(
                status_code=HTTPStatus.BAD_REQUEST,
                detail=f'Invalid value for custom field "{field_name}": {err}',
            ) from err
        filters.append(
            IssueFilterOutput(field=CustomFieldLinkOutput.from_obj(field), value=val)
        )
    return SuccessPayloadOutput(payload=IssueQueryToFiltersOutput(filters=filters))


@router.post('/build-query')
async def build_search_query(
    body: IssueFiltersToQueryBody,
) -> SuccessPayloadOutput[IssueFiltersToQueryOutput]:
    expressions = [await flt.to_query() for flt in body.filters]
    return SuccessPayloadOutput(
        payload=IssueFiltersToQueryOutput(query=' and '.join(expressions))
    )


async def _transform_val(field: m.CustomField, value: str) -> Any:
    if value == 'null':
        return None
    if field.type in (m.CustomFieldTypeT.USER, m.UserMultiCustomField):
        user = await m.User.find_one(m.User.email == value)
        if not user:
            raise HTTPException(
                status_code=HTTPStatus.BAD_REQUEST,
                detail=f'User with email {user} not found',
            )
        return field.validate_value(user.id)
    return field.validate_value(value)

from http import HTTPStatus
from uuid import UUID, uuid4

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel

import pm.models as m
from pm.api.context import current_user_context_dependency
from pm.api.utils.router import APIRouter
from pm.api.views.custom_fields import (
    CustomFieldOutput,
    CustomFieldOutputWithEnumOptions,
)
from pm.api.views.factories.crud import CrudCreateBody, CrudUpdateBody
from pm.api.views.output import BaseListOutput, ModelIdOutput, SuccessPayloadOutput
from pm.api.views.pararams import ListParams

__all__ = ('router',)

router = APIRouter(
    prefix='/custom_field',
    tags=['custom_field'],
    dependencies=[Depends(current_user_context_dependency)],
)


class EnumOptionCreateBody(BaseModel):
    value: str
    color: str | None = None


class EnumOptionUpdateBody(BaseModel):
    value: str | None = None
    color: str | None = None


class CustomFieldCreateBody(CrudCreateBody[m.CustomField]):
    name: str
    type: m.CustomFieldTypeT
    is_nullable: bool


class CustomFieldUpdateBody(CrudUpdateBody[m.CustomField]):
    name: str | None = None
    type: m.CustomFieldTypeT | None = None
    is_nullable: bool | None = None


@router.get('/list')
async def list_custom_fields(
    query: ListParams = Depends(),
) -> BaseListOutput[CustomFieldOutput | CustomFieldOutputWithEnumOptions]:
    q = m.CustomField.find(with_children=True).sort(m.CustomField.name)
    results = []
    async for obj in q.limit(query.limit).skip(query.offset):
        if obj.type in (m.CustomFieldTypeT.ENUM, m.CustomFieldTypeT.ENUM_MULTI):
            results.append(CustomFieldOutputWithEnumOptions.from_obj(obj))
            continue
        results.append(CustomFieldOutput.from_obj(obj))
    return BaseListOutput.make(
        count=await q.count(),
        limit=query.limit,
        offset=query.offset,
        items=results,
    )


@router.get('/{custom_field_id}')
async def get_custom_field(
    custom_field_id: PydanticObjectId,
) -> SuccessPayloadOutput[CustomFieldOutput | CustomFieldOutputWithEnumOptions]:
    obj = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id, with_children=True
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if obj.type in (m.CustomFieldTypeT.ENUM, m.CustomFieldTypeT.ENUM_MULTI):
        return SuccessPayloadOutput(
            payload=CustomFieldOutputWithEnumOptions.from_obj(obj)
        )
    return SuccessPayloadOutput(payload=CustomFieldOutput.from_obj(obj))


@router.post('/')
async def create_custom_field(body: CustomFieldCreateBody) -> ModelIdOutput:
    obj = body.create_obj(body.type.get_field_class())
    await obj.insert()
    return ModelIdOutput.from_obj(obj)


@router.put('/{custom_field_id}')
async def update_custom_field(
    custom_field_id: PydanticObjectId, body: CustomFieldUpdateBody
) -> ModelIdOutput:
    obj = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id, with_children=True
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    body.update_obj(obj)
    if obj.is_changed:
        await obj.save_changes()
    return ModelIdOutput.from_obj(obj)


@router.post('/{custom_field_id}/option')
async def add_enum_option(
    custom_field_id: PydanticObjectId, body: EnumOptionCreateBody
) -> ModelIdOutput:
    obj = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id, with_children=True
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if obj.type not in (m.CustomFieldTypeT.ENUM, m.CustomFieldTypeT.ENUM_MULTI):
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Custom field is not of type ENUM')
    obj.options[uuid4()] = m.EnumOption(value=body.value, color=body.color)
    if obj.is_changed:
        await obj.save_changes()
    return ModelIdOutput.from_obj(obj)


@router.put('/{custom_field_id}/option/{option_id}')
async def update_enum_option(
    custom_field_id: PydanticObjectId,
    option_id: UUID,
    body: EnumOptionUpdateBody,
) -> ModelIdOutput:
    obj = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id, with_children=True
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if obj.type not in (m.CustomFieldTypeT.ENUM, m.CustomFieldTypeT.ENUM_MULTI):
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Custom field is not of type ENUM')
    if option_id not in obj.options:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Option not found')
    for k, v in body.dict(exclude_unset=True).items():
        setattr(obj.options[option_id], k, v)
    # todo: update issues
    if obj.is_changed:
        await obj.save_changes()
    return ModelIdOutput.from_obj(obj)


@router.delete('/{custom_field_id}/option/{option_id}')
async def remove_enum_option(
    custom_field_id: PydanticObjectId, option_id: UUID
) -> ModelIdOutput:
    obj = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id, with_children=True
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if obj.type not in (m.CustomFieldTypeT.ENUM, m.CustomFieldTypeT.ENUM_MULTI):
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Custom field is not of type ENUM')
    if option_id not in obj.options:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Option not found')
    # todo: validate option is not in use
    obj.options.pop(option_id)
    # todo: update issues
    if obj.is_changed:
        await obj.save_changes()
    return ModelIdOutput.from_obj(obj)

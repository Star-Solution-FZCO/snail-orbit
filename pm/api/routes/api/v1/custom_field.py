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
    CustomFieldOutputWithUserOptions,
)
from pm.api.views.factories.crud import CrudCreateBody, CrudUpdateBody
from pm.api.views.output import BaseListOutput, SuccessPayloadOutput
from pm.api.views.pararams import ListParams

__all__ = ('router',)

router = APIRouter(
    prefix='/custom_field',
    tags=['custom_field'],
    dependencies=[Depends(current_user_context_dependency)],
)

CustomFieldOutputT = (
    CustomFieldOutput
    | CustomFieldOutputWithEnumOptions
    | CustomFieldOutputWithUserOptions
)


class EnumOptionCreateBody(BaseModel):
    value: str
    color: str | None = None


class UserOptionCreateBody(BaseModel):
    type: m.UserOptionType
    value: PydanticObjectId


class EnumOptionUpdateBody(BaseModel):
    value: str | None = None
    color: str | None = None


class CustomFieldCreateBody(CrudCreateBody[m.CustomField]):
    name: str
    type: m.CustomFieldTypeT
    is_nullable: bool


class CustomFieldUpdateBody(CrudUpdateBody[m.CustomField]):
    name: str | None = None
    is_nullable: bool | None = None


def output_from_obj(obj: m.CustomField) -> CustomFieldOutputT:
    if obj.type in (m.CustomFieldTypeT.ENUM, m.CustomFieldTypeT.ENUM_MULTI):
        return CustomFieldOutputWithEnumOptions.from_obj(obj)
    if obj.type in (m.CustomFieldTypeT.USER, m.CustomFieldTypeT.USER_MULTI):
        return CustomFieldOutputWithUserOptions.from_obj(obj)
    return CustomFieldOutput.from_obj(obj)


@router.get('/list')
async def list_custom_fields(
    query: ListParams = Depends(),
) -> BaseListOutput[CustomFieldOutputT]:
    q = m.CustomField.find(with_children=True).sort(m.CustomField.name)
    return BaseListOutput.make(
        count=await q.count(),
        limit=query.limit,
        offset=query.offset,
        items=[
            output_from_obj(obj)
            async for obj in q.limit(query.limit).skip(query.offset)
        ],
    )


@router.get('/{custom_field_id}')
async def get_custom_field(
    custom_field_id: PydanticObjectId,
) -> SuccessPayloadOutput[CustomFieldOutputT]:
    obj = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id, with_children=True
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    return SuccessPayloadOutput(payload=output_from_obj(obj))


@router.post('/')
async def create_custom_field(
    body: CustomFieldCreateBody,
) -> SuccessPayloadOutput[CustomFieldOutputT]:
    obj = body.create_obj(body.type.get_field_class())
    await obj.insert()
    return SuccessPayloadOutput(payload=output_from_obj(obj))


@router.put('/{custom_field_id}')
async def update_custom_field(
    custom_field_id: PydanticObjectId, body: CustomFieldUpdateBody
) -> SuccessPayloadOutput[CustomFieldOutputT]:
    obj: m.CustomField | None = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id, with_children=True
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    body.update_obj(obj)
    if obj.is_changed:
        await obj.save_changes()
    return SuccessPayloadOutput(payload=output_from_obj(obj))


@router.post('/{custom_field_id}/option')
async def add_enum_option(
    custom_field_id: PydanticObjectId,
    body: EnumOptionCreateBody,
) -> SuccessPayloadOutput[CustomFieldOutputT]:
    obj: m.CustomField | None = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id, with_children=True
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if obj.type not in (m.CustomFieldTypeT.ENUM, m.CustomFieldTypeT.ENUM_MULTI):
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Custom field is not of type ENUM')
    obj.options[uuid4()] = m.EnumOption(value=body.value, color=body.color)
    if obj.is_changed:
        await obj.save_changes()
    return SuccessPayloadOutput(payload=output_from_obj(obj))


@router.put('/{custom_field_id}/option/{option_id}')
async def update_enum_option(
    custom_field_id: PydanticObjectId,
    option_id: UUID,
    body: EnumOptionUpdateBody,
) -> SuccessPayloadOutput[CustomFieldOutputT]:
    obj: m.CustomField | None = await m.CustomField.find_one(
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
    return SuccessPayloadOutput(payload=output_from_obj(obj))


@router.delete('/{custom_field_id}/option/{option_id}')
async def remove_enum_option(
    custom_field_id: PydanticObjectId,
    option_id: UUID,
) -> SuccessPayloadOutput[CustomFieldOutputT]:
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
        await obj.replace()
    return SuccessPayloadOutput(payload=output_from_obj(obj))


@router.post('/{custom_field_id}/user_option')
async def add_user_option(
    custom_field_id: PydanticObjectId,
    body: UserOptionCreateBody,
) -> SuccessPayloadOutput[CustomFieldOutputT]:
    obj: m.CustomField | None = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id, with_children=True
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if not isinstance(obj, m.UserCustomField | m.UserMultiCustomField):
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Custom field is not of type USER')
    if body.type == m.UserOptionType.GROUP and any(
        opt.value.group.id == body.value
        for opt in obj.options
        if opt.type == m.UserOptionType.GROUP
    ):
        raise HTTPException(HTTPStatus.CONFLICT, 'Group already added')
    if body.type == m.UserOptionType.USER and any(
        opt.value.id == body.value
        for opt in obj.options
        if opt.type == m.UserOptionType.USER
    ):
        raise HTTPException(HTTPStatus.CONFLICT, 'User already added')
    if body.type == m.UserOptionType.GROUP:
        gr: m.Group | None = await m.Group.find_one(m.Group.id == body.value)
        if not gr:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Group not found')
        users = await m.User.find(m.User.groups.id == gr.id).to_list()
        value = m.GroupOption(
            group=m.GroupLinkField.from_obj(gr),
            users=[m.UserLinkField.from_obj(user) for user in users],
        )
    else:
        user: m.User | None = await m.User.find_one(m.User.id == body.value)
        if not user:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'User not found')
        value = m.UserLinkField.from_obj(user)
    obj.options.append(m.UserOption(id=uuid4(), type=body.type, value=value))
    if obj.is_changed:
        await obj.save_changes()
    return SuccessPayloadOutput(payload=output_from_obj(obj))


@router.delete('/{custom_field_id}/user_option/{option_id}')
async def remove_user_option(
    custom_field_id: PydanticObjectId,
    option_id: UUID,
) -> SuccessPayloadOutput[CustomFieldOutputT]:
    obj = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id, with_children=True
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if not isinstance(obj, m.UserCustomField | m.UserMultiCustomField):
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Custom field is not of type USER')
    opt = next((opt for opt in obj.options if opt.id == option_id), None)
    if not opt:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Option not found')
    obj.options.remove(opt)
    if obj.is_changed:
        await obj.replace()
    return SuccessPayloadOutput(payload=output_from_obj(obj))

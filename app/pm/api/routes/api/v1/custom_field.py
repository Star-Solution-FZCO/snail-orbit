import asyncio
from datetime import date, datetime
from http import HTTPStatus
from typing import Any, Type
from uuid import UUID, uuid4

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel, Field

import pm.models as m
from pm.api.context import current_user_context_dependency
from pm.api.utils.router import APIRouter
from pm.api.views.custom_fields import (
    CustomFieldOutputT,
    CustomFieldSelectOptionsT,
    EnumOptionOutput,
    StateOptionOutput,
    VersionOptionOutput,
    cf_output_from_obj,
)
from pm.api.views.output import BaseListOutput, ModelIdOutput, SuccessPayloadOutput
from pm.api.views.params import ListParams
from pm.api.views.select import (
    SelectParams,
    enum_option_select,
    state_option_select,
    user_link_select,
    version_option_select,
)
from pm.api.views.user import UserOutput

__all__ = ('router',)

router = APIRouter(
    prefix='/custom_field',
    tags=['custom_field'],
    dependencies=[Depends(current_user_context_dependency)],
)


class EnumOptionCreateBody(BaseModel):
    value: str
    color: str | None = None
    is_archived: bool = False


class UserOptionCreateBody(BaseModel):
    type: m.UserOptionType
    value: PydanticObjectId


class StateOptionCreateBody(BaseModel):
    value: str
    color: str | None = None
    is_resolved: bool = False
    is_closed: bool = False
    is_archived: bool = False


class VersionOptionCreateBody(BaseModel):
    value: str
    release_date: date | None = None
    is_released: bool = False
    is_archived: bool = False


class EnumOptionUpdateBody(BaseModel):
    value: str | None = None
    color: str | None = None
    is_archived: bool | None = None


class StateOptionUpdateBody(BaseModel):
    value: str | None = None
    color: str | None = None
    is_resolved: bool | None = None
    is_closed: bool | None = None
    is_archived: bool | None = None


class VersionOptionUpdateBody(BaseModel):
    value: str | None = None
    release_date: date | None = None
    is_released: bool | None = None
    is_archived: bool | None = None


class CustomFieldCreateBody(BaseModel):
    name: str = Field(pattern=r'^[a-zA-Z_0-9][a-zA-Z0-9_ -]*$')
    type: m.CustomFieldTypeT
    is_nullable: bool
    default_value: Any | None = None
    description: str | None = None
    ai_description: str | None = None

    def create_obj(self, cls: Type[m.CustomField]) -> m.CustomField:
        obj = cls(
            name=self.name,
            type=self.type,
            is_nullable=self.is_nullable,
            description=self.description,
            ai_description=self.ai_description,
        )
        if self.default_value is not None:
            obj.default_value = obj.validate_value(self.default_value)
        return obj


class CustomFieldUpdateBody(BaseModel):
    name: str | None = Field(default=None, pattern=r'^[a-zA-Z_0-9][a-zA-Z0-9_ -]*$')
    is_nullable: bool | None = None
    default_value: Any | None = None
    description: str | None = None
    ai_description: str | None = None

    def update_obj(self, obj: m.CustomField) -> None:
        for k, v in self.dict(exclude_unset=True).items():
            if k == 'default_value':
                v = obj.validate_value(v) if v is not None else None
            setattr(obj, k, v)


@router.get('/list')
async def list_custom_fields(
    query: ListParams = Depends(),
) -> BaseListOutput[CustomFieldOutputT]:
    q = m.CustomField.find(with_children=True).sort(m.CustomField.name)
    return await BaseListOutput.make_from_query(
        q,
        limit=query.limit,
        offset=query.offset,
        projection_fn=cf_output_from_obj,
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
    return SuccessPayloadOutput(payload=cf_output_from_obj(obj))


@router.post('/')
async def create_custom_field(
    body: CustomFieldCreateBody,
) -> SuccessPayloadOutput[CustomFieldOutputT]:
    try:
        obj = body.create_obj(body.type.get_field_class())
    except m.CustomFieldValidationError as err:
        raise HTTPException(HTTPStatus.BAD_REQUEST, str(err)) from err
    await obj.insert()
    return SuccessPayloadOutput(payload=cf_output_from_obj(obj))


@router.put('/{custom_field_id}')
async def update_custom_field(
    custom_field_id: PydanticObjectId, body: CustomFieldUpdateBody
) -> SuccessPayloadOutput[CustomFieldOutputT]:
    obj: m.CustomField | None = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id, with_children=True
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    try:
        body.update_obj(obj)
    except m.CustomFieldValidationError as err:
        raise HTTPException(HTTPStatus.BAD_REQUEST, str(err)) from err
    if obj.is_changed:
        await obj.save_changes()
        await asyncio.gather(
            m.Issue.update_field_embedded_links(obj),
            m.IssueDraft.update_field_embedded_links(obj),
            m.Board.update_field_embedded_links(obj),
        )
    return SuccessPayloadOutput(payload=cf_output_from_obj(obj))


@router.delete('/{custom_field_id}')
async def delete_custom_field(
    custom_field_id: PydanticObjectId,
) -> ModelIdOutput:
    obj: m.CustomField | None = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id, with_children=True
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if in_use := await m.Project.find({'custom_fields.$id': custom_field_id}).count():
        raise HTTPException(
            HTTPStatus.CONFLICT,
            f'Custom field is in use in {in_use} projects. Unlink it first.',
        )
    await obj.delete()
    return ModelIdOutput.make(custom_field_id)


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
    if any(opt.value == body.value for opt in obj.options):
        raise HTTPException(HTTPStatus.CONFLICT, 'Option already added')
    obj.options.append(
        m.EnumField(
            id=str(uuid4()),
            value=body.value,
            color=body.color,
            is_archived=body.is_archived,
        )
    )
    if obj.is_changed:
        await obj.save_changes()
    return SuccessPayloadOutput(payload=cf_output_from_obj(obj))


@router.put('/{custom_field_id}/option/{option_id}')
async def update_enum_option(
    custom_field_id: PydanticObjectId,
    option_id: UUID,
    body: EnumOptionUpdateBody,
) -> SuccessPayloadOutput[CustomFieldOutputT]:
    option_id_ = str(option_id)
    obj: m.CustomField | None = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id, with_children=True
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if obj.type not in (m.CustomFieldTypeT.ENUM, m.CustomFieldTypeT.ENUM_MULTI):
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Custom field is not of type ENUM')
    opt = next((opt for opt in obj.options if opt.id == option_id_))
    if not opt:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Option not found')
    for k, v in body.dict(exclude_unset=True).items():
        setattr(opt, k, v)
    if obj.default_value and obj.default_value.id == opt.id:
        obj.default_value = opt
    if obj.is_changed:
        await obj.save_changes()
        await asyncio.gather(
            m.IssueDraft.update_field_option_embedded_links(obj, opt),
            m.Issue.update_field_option_embedded_links(obj, opt),
        )

    return SuccessPayloadOutput(payload=cf_output_from_obj(obj))


@router.delete('/{custom_field_id}/option/{option_id}')
async def remove_enum_option(
    custom_field_id: PydanticObjectId,
    option_id: UUID,
) -> SuccessPayloadOutput[CustomFieldOutputT]:
    option_id_ = str(option_id)
    obj = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id, with_children=True
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if obj.type not in (m.CustomFieldTypeT.ENUM, m.CustomFieldTypeT.ENUM_MULTI):
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Custom field is not of type ENUM')
    opt = next((opt for opt in obj.options if opt.id == option_id_))
    if not opt:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Option not found')
    if in_use := await count_issues_with_option(custom_field_id, opt.id):
        raise HTTPException(
            HTTPStatus.CONFLICT,
            f'Option is in use in {in_use} issues',
        )
    if obj.default_value and obj.default_value.id == opt.id:
        obj.default_value = None
    obj.options.remove(opt)
    if obj.is_changed:
        await obj.replace()
    return SuccessPayloadOutput(payload=cf_output_from_obj(obj))


@router.post('/{custom_field_id}/user-option')
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
    return SuccessPayloadOutput(payload=cf_output_from_obj(obj))


@router.delete('/{custom_field_id}/user-option/{option_id}')
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
    return SuccessPayloadOutput(payload=cf_output_from_obj(obj))


@router.post('/{custom_field_id}/state-option')
async def add_state_option(
    custom_field_id: PydanticObjectId,
    body: StateOptionCreateBody,
) -> SuccessPayloadOutput[CustomFieldOutputT]:
    obj: m.CustomField | None = await m.StateCustomField.find_one(
        m.StateCustomField.id == custom_field_id
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if any(opt.state == body.value for opt in obj.options):
        raise HTTPException(HTTPStatus.CONFLICT, 'Option already added')
    obj.options.append(
        m.StateField(
            id=str(uuid4()),
            state=body.value,
            is_resolved=body.is_resolved,
            is_closed=body.is_closed,
            color=body.color,
            is_archived=body.is_archived,
        )
    )
    if obj.is_changed:
        await obj.save_changes()
    return SuccessPayloadOutput(payload=cf_output_from_obj(obj))


@router.put('/{custom_field_id}/state-option/{option_id}')
async def update_state_option(
    custom_field_id: PydanticObjectId,
    option_id: UUID,
    body: StateOptionUpdateBody,
) -> SuccessPayloadOutput[CustomFieldOutputT]:
    option_id_ = str(option_id)
    obj: m.CustomField | None = await m.StateCustomField.find_one(
        m.StateCustomField.id == custom_field_id
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    opt = next((opt for opt in obj.options if opt.id == option_id_))
    if not opt:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Option not found')
    for k, v in body.dict(exclude_unset=True).items():
        k = 'state' if k == 'value' else k
        setattr(opt, k, v)
    if obj.default_value and obj.default_value.id == opt.id:
        obj.default_value = opt
    if obj.is_changed:
        await obj.save_changes()
        await asyncio.gather(
            m.IssueDraft.update_field_option_embedded_links(obj, opt),
            m.Issue.update_field_option_embedded_links(obj, opt),
        )
    return SuccessPayloadOutput(payload=cf_output_from_obj(obj))


@router.delete('/{custom_field_id}/state-option/{option_id}')
async def remove_state_option(
    custom_field_id: PydanticObjectId,
    option_id: UUID,
) -> SuccessPayloadOutput[CustomFieldOutputT]:
    option_id_ = str(option_id)
    obj: m.CustomField | None = await m.StateCustomField.find_one(
        m.StateCustomField.id == custom_field_id
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    opt = next((opt for opt in obj.options if opt.id == option_id_))
    if not opt:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Option not found')
    if in_use := await count_issues_with_option(custom_field_id, opt.id):
        raise HTTPException(
            HTTPStatus.CONFLICT,
            f'Option is in use in {in_use} issues',
        )
    obj.options.remove(opt)
    if obj.default_value and obj.default_value.id == opt.id:
        obj.default_value = None
    if obj.is_changed:
        await obj.replace()
    return SuccessPayloadOutput(payload=cf_output_from_obj(obj))


@router.post('/{custom_field_id}/version-option')
async def add_version_option(
    custom_field_id: PydanticObjectId,
    body: VersionOptionCreateBody,
) -> SuccessPayloadOutput[CustomFieldOutputT]:
    obj: m.CustomField | None = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id, with_children=True
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if obj.type not in (m.CustomFieldTypeT.VERSION, m.CustomFieldTypeT.VERSION_MULTI):
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            'Custom field is not of type VERSION or VERSION_MULTI',
        )
    if any(opt.version == body.value for opt in obj.options):
        raise HTTPException(HTTPStatus.CONFLICT, 'Option already added')
    obj.options.append(
        m.VersionField(
            id=str(uuid4()),
            version=body.value,
            release_date=datetime.combine(body.release_date, datetime.min.time())
            if body.release_date
            else None,
            is_released=body.is_released,
            is_archived=body.is_archived,
        ),
    )
    if obj.is_changed:
        await obj.save_changes()
    return SuccessPayloadOutput(payload=cf_output_from_obj(obj))


@router.put('/{custom_field_id}/version-option/{option_id}')
async def update_version_option(
    custom_field_id: PydanticObjectId,
    option_id: UUID,
    body: VersionOptionUpdateBody,
) -> SuccessPayloadOutput[CustomFieldOutputT]:
    option_id_ = str(option_id)
    obj: m.CustomField | None = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id, with_children=True
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if obj.type not in (m.CustomFieldTypeT.VERSION, m.CustomFieldTypeT.VERSION_MULTI):
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            'Custom field is not of type VERSION or VERSION_MULTI',
        )
    opt = next((opt for opt in obj.options if opt.id == option_id_))
    if not opt:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Option not found')
    for k, v in body.dict(exclude_unset=True).items():
        k = 'version' if k == 'value' else k
        if k == 'release_date':
            v = datetime.combine(v, datetime.min.time()) if v else None
        setattr(opt, k, v)
    if obj.default_value and obj.default_value.id == opt.id:
        obj.default_value = opt
    if obj.is_changed:
        await obj.save_changes()
        await asyncio.gather(
            m.IssueDraft.update_field_option_embedded_links(obj, opt),
            m.Issue.update_field_option_embedded_links(obj, opt),
        )
    return SuccessPayloadOutput(payload=cf_output_from_obj(obj))


@router.delete('/{custom_field_id}/version-option/{option_id}')
async def remove_version_option(
    custom_field_id: PydanticObjectId,
    option_id: UUID,
) -> SuccessPayloadOutput[CustomFieldOutputT]:
    option_id_ = str(option_id)
    obj: m.CustomField | None = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id, with_children=True
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if obj.type not in (m.CustomFieldTypeT.VERSION, m.CustomFieldTypeT.VERSION_MULTI):
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            'Custom field is not of type VERSION or VERSION_MULTI',
        )
    opt = next((opt for opt in obj.options if opt.id == option_id_))
    if not opt:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Option not found')
    if in_use := await count_issues_with_option(custom_field_id, opt.id):
        raise HTTPException(
            HTTPStatus.CONFLICT,
            f'Option is in use in {in_use} issues',
        )
    obj.options.remove(opt)
    if obj.default_value and obj.default_value.id == opt.id:
        obj.default_value = None
    if obj.is_changed:
        await obj.replace()
    return SuccessPayloadOutput(payload=cf_output_from_obj(obj))


@router.get('/{custom_field_id}/select')
async def select_options(
    custom_field_id: PydanticObjectId,
    query: SelectParams = Depends(),
) -> BaseListOutput[CustomFieldSelectOptionsT]:
    obj = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id, with_children=True
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if isinstance(obj, m.UserCustomField | m.UserMultiCustomField):
        selected = user_link_select(obj.users, query)
        return BaseListOutput.make(
            count=selected.total,
            limit=selected.limit,
            offset=selected.offset,
            items=[UserOutput.from_obj(user) for user in selected.items],
        )
    if isinstance(obj, m.StateCustomField):
        selected = state_option_select(obj.options, query)
        return BaseListOutput.make(
            count=selected.total,
            limit=selected.limit,
            offset=selected.offset,
            items=[StateOptionOutput.from_obj(opt) for opt in selected.items],
        )
    if isinstance(obj, m.EnumCustomField | m.EnumMultiCustomField):
        selected = enum_option_select(obj.options, query)
        return BaseListOutput.make(
            count=selected.total,
            limit=selected.limit,
            offset=selected.offset,
            items=[EnumOptionOutput.from_obj(opt) for opt in selected.items],
        )
    if isinstance(obj, m.VersionCustomField | m.VersionMultiCustomField):
        selected = version_option_select(obj.options, query)
        return BaseListOutput.make(
            count=selected.total,
            limit=selected.limit,
            offset=selected.offset,
            items=[VersionOptionOutput.from_obj(opt) for opt in selected.items],
        )
    raise HTTPException(HTTPStatus.BAD_REQUEST, 'Custom field is not select-able')


async def count_issues_with_option(
    custom_field_id: PydanticObjectId, option_id: str
) -> int:
    return await m.Issue.find(
        {'fields': {'$elemMatch': {'id': custom_field_id, 'value.id': option_id}}}
    ).count()

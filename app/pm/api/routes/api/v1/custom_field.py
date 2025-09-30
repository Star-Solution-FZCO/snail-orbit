# pylint: disable=too-many-lines
import asyncio
from datetime import date, datetime
from http import HTTPStatus
from typing import Any
from uuid import UUID, uuid4

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel, Field

import pm.models as m
from pm.api.context import current_user_context_dependency
from pm.api.utils.router import APIRouter
from pm.api.views.custom_fields import (
    CustomFieldGroupOutputRootModel,
    CustomFieldGroupSelectOptionsT,
    CustomFieldOutputRootModel,
    CustomFieldSelectOptionsT,
    EnumOptionOutput,
    OwnedOptionOutput,
    ShortOptionOutput,
    SprintOptionOutput,
    StateOptionOutput,
    UserFieldValueOutput,
    VersionOptionOutput,
    cf_group_output_cls_from_type,
    cf_output_from_obj,
)
from pm.api.views.error_responses import error_responses
from pm.api.views.output import (
    BaseListOutput,
    ErrorOutput,
    ModelIdOutput,
    SuccessPayloadOutput,
)
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
    responses=error_responses(
        (HTTPStatus.UNAUTHORIZED, ErrorOutput),
        (HTTPStatus.FORBIDDEN, ErrorOutput),
    ),
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


class OwnedOptionCreateBody(BaseModel):
    value: str
    owner: PydanticObjectId | None = None
    color: str | None = None
    is_archived: bool = False


class OwnedOptionUpdateBody(BaseModel):
    value: str | None = None
    owner: PydanticObjectId | None = None
    color: str | None = None
    is_archived: bool | None = None


class SprintOptionCreateBody(BaseModel):
    value: str
    is_completed: bool = False
    is_archived: bool = False
    color: str | None = None
    planed_start_date: date | None = None
    planed_end_date: date | None = None
    start_date: date | None = None
    end_date: date | None = None
    description: str | None = None


class SprintOptionUpdateBody(BaseModel):
    value: str | None = None
    is_completed: bool | None = None
    is_archived: bool | None = None
    color: str | None = None
    planed_start_date: date | None = None
    planed_end_date: date | None = None
    start_date: date | None = None
    end_date: date | None = None
    description: str | None = None


class CustomFieldCreateBody(BaseModel):
    label: str
    is_nullable: bool
    default_value: Any | None = None


class CustomFieldGroupCreateBody(BaseModel):
    name: str = Field(pattern=r'^[a-zA-Z_0-9][a-zA-Z0-9_ -]*$')
    type: m.CustomFieldTypeT
    description: str | None = None
    ai_description: str | None = None

    label: str = 'default'
    is_nullable: bool = True
    default_value: Any | None = None


class CustomFieldUpdateBody(BaseModel):
    is_nullable: bool | None = None
    default_value: Any | None = None
    label: str | None = None

    async def update_obj(self, obj: m.CustomField) -> None:
        for k, value in self.model_dump(exclude_unset=True).items():
            if k == 'default_value':
                processed_value = (
                    await obj.validate_value(value) if value is not None else None
                )
                setattr(obj, k, processed_value)
            else:
                setattr(obj, k, value)


class CustomFieldGroupUpdateBody(BaseModel):
    name: str | None = Field(default=None, pattern=r'^[a-zA-Z_0-9][a-zA-Z0-9_ -]*$')
    description: str | None = None
    ai_description: str | None = None


class CustomFieldCopyBody(BaseModel):
    label: str = Field(description='Label for the copied field')


@router.get('/group/list')
async def list_custom_field_groups(
    query: ListParams = Depends(),
) -> BaseListOutput[CustomFieldGroupOutputRootModel]:
    q = m.CustomField.find(with_children=True, fetch_links=True)
    query.apply_filter(q, m.CustomField)
    query.apply_sort(q, m.CustomField, (m.CustomField.name,))
    if query.search:
        q = q.find(m.CustomField.search_query(query.search))
    fields = await q.to_list()
    results = {}
    for field in fields:
        if field.gid not in results:
            results[field.gid] = cf_group_output_cls_from_type(field.type)(
                gid=field.gid,
                name=field.name,
                type=field.type,
                description=field.description,
                ai_description=field.ai_description,
                fields=[],
            )
        results[field.gid].fields.append(await cf_output_from_obj(field))

    return BaseListOutput.make(
        count=len(results),
        limit=query.limit,
        offset=query.offset,
        items=list(results.values())[query.offset : query.offset + query.limit],
    )


@router.get('/group/{custom_field_gid}')
async def get_custom_field_group(
    custom_field_gid: str,
) -> SuccessPayloadOutput[CustomFieldGroupOutputRootModel]:
    objs = await m.CustomField.find(
        m.CustomField.gid == custom_field_gid,
        with_children=True,
        fetch_links=True,
    ).to_list()
    if not objs:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field group not found')
    return SuccessPayloadOutput(
        payload=cf_group_output_cls_from_type(objs[0].type)(
            gid=custom_field_gid,
            name=objs[0].name,
            type=objs[0].type,
            description=objs[0].description,
            ai_description=objs[0].ai_description,
            fields=[await cf_output_from_obj(obj) for obj in objs],
        ),
    )


@router.get('/{custom_field_id}')
@router.get('/group/{custom_field_gid}/field/{custom_field_id}')
async def get_custom_field(
    custom_field_id: PydanticObjectId,
) -> SuccessPayloadOutput[CustomFieldOutputRootModel]:
    obj = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id,
        with_children=True,
        fetch_links=True,
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    return SuccessPayloadOutput(payload=await cf_output_from_obj(obj))


@router.post('/group/{custom_field_gid}/field')
async def create_custom_field(
    custom_field_gid: str,
    body: CustomFieldCreateBody,
) -> SuccessPayloadOutput[CustomFieldOutputRootModel]:
    existed_field = await m.CustomField.find_one(
        m.CustomField.gid == custom_field_gid,
        with_children=True,
    )
    if not existed_field:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field group not found')
    field_cls = m.get_cf_class(existed_field.type)

    obj = field_cls(
        gid=existed_field.gid,
        name=existed_field.name,
        type=existed_field.type,
        description=existed_field.description,
        ai_description=existed_field.ai_description,
        is_nullable=body.is_nullable,
        label=body.label,
        projects=[],
    )

    if body.default_value is not None:
        try:
            obj.default_value = await obj.validate_value(body.default_value)
        except m.CustomFieldValidationError as err:
            raise HTTPException(HTTPStatus.BAD_REQUEST, str(err)) from err

    await obj.insert()
    return SuccessPayloadOutput(payload=await cf_output_from_obj(obj))


@router.post('/group')
async def create_custom_field_group(
    body: CustomFieldGroupCreateBody,
) -> SuccessPayloadOutput[CustomFieldGroupOutputRootModel]:
    if await m.CustomField.find(
        m.CustomField.name == body.name,
        with_children=True,
    ).exists():
        raise HTTPException(HTTPStatus.CONFLICT, 'Custom field already exists')
    field_cls = m.get_cf_class(body.type)
    obj = field_cls(
        gid=str(uuid4()),
        name=body.name,
        type=body.type,
        description=body.description,
        ai_description=body.ai_description,
        is_nullable=body.is_nullable,
        label=body.label,
        projects=[],
    )
    if body.default_value is not None:
        obj.default_value = await obj.validate_value(body.default_value)

    await obj.insert()
    return SuccessPayloadOutput(
        payload=cf_group_output_cls_from_type(obj.type)(
            gid=obj.gid,
            name=obj.name,
            type=obj.type,
            description=obj.description,
            ai_description=obj.ai_description,
            fields=[await cf_output_from_obj(obj)],
        ),
    )


@router.put('/{custom_field_id}')
@router.put('/group/{custom_field_gid}/field/{custom_field_id}')
async def update_custom_field(
    custom_field_id: PydanticObjectId,
    body: CustomFieldUpdateBody,
) -> SuccessPayloadOutput[CustomFieldOutputRootModel]:
    obj: m.CustomField | None = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id,
        with_children=True,
        fetch_links=True,
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    try:
        await body.update_obj(obj)
    except m.CustomFieldValidationError as err:
        raise HTTPException(HTTPStatus.BAD_REQUEST, str(err)) from err
    if obj.is_changed:
        await obj.replace()
    return SuccessPayloadOutput(payload=await cf_output_from_obj(obj))


@router.put('/group/{custom_field_gid}')
async def update_custom_field_group(
    custom_field_gid: str,
    body: CustomFieldGroupUpdateBody,
) -> SuccessPayloadOutput[CustomFieldGroupOutputRootModel]:
    fields = await m.CustomField.find(
        m.CustomField.gid == custom_field_gid,
        with_children=True,
        fetch_links=True,
    ).to_list()
    if not fields:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field group not found')
    name_changed = body.name and body.name != fields[0].name
    for field in fields:
        for k, v in body.model_dump(exclude_unset=True).items():
            setattr(field, k, v)
        await field.replace()
    if name_changed:
        for field in fields:
            await asyncio.gather(
                m.Issue.update_field_embedded_links(field),
                m.IssueDraft.update_field_embedded_links(field),
                m.Board.update_field_embedded_links(field),
                m.Report.update_field_embedded_links(field),
            )
    return SuccessPayloadOutput(
        payload=cf_group_output_cls_from_type(fields[0].type)(
            gid=custom_field_gid,
            name=fields[0].name,
            type=fields[0].type,
            description=fields[0].description,
            ai_description=fields[0].ai_description,
            fields=[await cf_output_from_obj(obj) for obj in fields],
        ),
    )


@router.delete('/{custom_field_id}')
@router.delete('/group/{custom_field_gid}/field/{custom_field_id}')
async def delete_custom_field(
    custom_field_id: PydanticObjectId,
) -> ModelIdOutput:
    obj: m.CustomField | None = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id,
        with_children=True,
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


@router.post('/{custom_field_id}/copy')
@router.post('/group/{custom_field_gid}/field/{custom_field_id}/copy')
async def copy_custom_field(
    custom_field_id: PydanticObjectId,
    body: CustomFieldCopyBody,
) -> SuccessPayloadOutput[CustomFieldOutputRootModel]:
    obj: m.CustomField | None = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id,
        with_children=True,
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')

    field_cls = m.get_cf_class(obj.type)
    copied_obj = field_cls(
        gid=obj.gid,
        name=obj.name,
        type=obj.type,
        description=obj.description,
        ai_description=obj.ai_description,
        label=body.label,
        is_nullable=obj.is_nullable,
        projects=[],
    )

    if hasattr(obj, 'options'):
        copied_options = []
        for option in obj.options:
            copied_option = option.model_copy(update={'id': str(uuid4())})
            copied_options.append(copied_option)
        copied_obj.options = copied_options

    if obj.default_value is not None:
        try:
            copied_obj.default_value = await copied_obj.validate_value(
                obj.default_value
            )
        except m.CustomFieldValidationError as err:
            raise HTTPException(HTTPStatus.BAD_REQUEST, str(err)) from err

    await copied_obj.insert()

    return SuccessPayloadOutput(payload=await cf_output_from_obj(copied_obj))


@router.post('/{custom_field_id}/option')
@router.post('/group/{custom_field_gid}/field/{custom_field_id}/option')
async def add_enum_option(
    custom_field_id: PydanticObjectId,
    body: EnumOptionCreateBody,
) -> SuccessPayloadOutput[CustomFieldOutputRootModel]:
    obj: m.CustomField | None = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id,
        with_children=True,
        fetch_links=True,
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if obj.type not in (m.CustomFieldTypeT.ENUM, m.CustomFieldTypeT.ENUM_MULTI):
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Custom field is not of type ENUM')
    if any(opt.value == body.value for opt in obj.options):
        raise HTTPException(HTTPStatus.CONFLICT, 'Option already added')
    obj.options.append(
        m.EnumOption(
            id=str(uuid4()),
            value=body.value,
            color=body.color,
            is_archived=body.is_archived,
        ),
    )
    if obj.is_changed:
        await obj.replace()
    return SuccessPayloadOutput(payload=await cf_output_from_obj(obj))


@router.put('/{custom_field_id}/option/{option_id}')
@router.put('/group/{custom_field_gid}/field/{custom_field_id}/option/{option_id}')
async def update_enum_option(
    custom_field_id: PydanticObjectId,
    option_id: UUID,
    body: EnumOptionUpdateBody,
) -> SuccessPayloadOutput[CustomFieldOutputRootModel]:
    option_id_ = str(option_id)
    obj: m.CustomField | None = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id,
        with_children=True,
        fetch_links=True,
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if obj.type not in (m.CustomFieldTypeT.ENUM, m.CustomFieldTypeT.ENUM_MULTI):
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Custom field is not of type ENUM')
    opt = next(opt for opt in obj.options if opt.id == option_id_)
    if not opt:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Option not found')
    for k, v in body.dict(exclude_unset=True).items():
        setattr(opt, k, v)
    if obj.default_value and obj.default_value.id == opt.id:
        obj.default_value = opt
    if obj.is_changed:
        await obj.replace()
        await asyncio.gather(
            m.IssueDraft.update_field_option_embedded_links(obj, opt),
            m.Issue.update_field_option_embedded_links(obj, opt),
        )

    return SuccessPayloadOutput(payload=await cf_output_from_obj(obj))


@router.delete('/{custom_field_id}/option/{option_id}')
@router.delete('/group/{custom_field_gid}/field/{custom_field_id}/option/{option_id}')
async def remove_enum_option(
    custom_field_id: PydanticObjectId,
    option_id: UUID,
) -> SuccessPayloadOutput[CustomFieldOutputRootModel]:
    option_id_ = str(option_id)
    obj = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id,
        with_children=True,
        fetch_links=True,
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if obj.type not in (m.CustomFieldTypeT.ENUM, m.CustomFieldTypeT.ENUM_MULTI):
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Custom field is not of type ENUM')
    opt = next(opt for opt in obj.options if opt.id == option_id_)
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
    return SuccessPayloadOutput(payload=await cf_output_from_obj(obj))


@router.post('/{custom_field_id}/user-option')
@router.post('/group/{custom_field_gid}/field/{custom_field_id}/user-option')
async def add_user_option(
    custom_field_id: PydanticObjectId,
    body: UserOptionCreateBody,
) -> SuccessPayloadOutput[CustomFieldOutputRootModel]:
    obj: m.CustomField | None = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id,
        with_children=True,
        fetch_links=True,
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
        gr: m.Group | None = await m.Group.find_one(
            m.Group.id == body.value, with_children=True
        )
        if not gr:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'Group not found')
        value = m.GroupOption(
            group=m.GroupLinkField.from_obj(gr),
        )
    else:
        user: m.User | None = await m.User.find_one(m.User.id == body.value)
        if not user:
            raise HTTPException(HTTPStatus.BAD_REQUEST, 'User not found')
        value = m.UserLinkField.from_obj(user)
    obj.options.append(m.UserOption(id=uuid4(), type=body.type, value=value))
    if obj.is_changed:
        await obj.replace()
    return SuccessPayloadOutput(payload=await cf_output_from_obj(obj))


@router.delete('/{custom_field_id}/user-option/{option_id}')
@router.delete(
    '/group/{custom_field_gid}/field/{custom_field_id}/user-option/{option_id}',
)
async def remove_user_option(
    custom_field_id: PydanticObjectId,
    option_id: UUID,
) -> SuccessPayloadOutput[CustomFieldOutputRootModel]:
    obj = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id,
        with_children=True,
        fetch_links=True,
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
    return SuccessPayloadOutput(payload=await cf_output_from_obj(obj))


@router.post('/{custom_field_id}/state-option')
@router.post('/group/{custom_field_gid}/field/{custom_field_id}/state-option')
async def add_state_option(
    custom_field_id: PydanticObjectId,
    body: StateOptionCreateBody,
) -> SuccessPayloadOutput[CustomFieldOutputRootModel]:
    obj: m.CustomField | None = await m.StateCustomField.find_one(
        m.StateCustomField.id == custom_field_id,
        fetch_links=True,
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if any(opt.value == body.value for opt in obj.options):
        raise HTTPException(HTTPStatus.CONFLICT, 'Option already added')
    obj.options.append(
        m.StateOption(
            id=str(uuid4()),
            value=body.value,
            is_resolved=body.is_resolved,
            is_closed=body.is_closed,
            color=body.color,
            is_archived=body.is_archived,
        ),
    )
    if obj.is_changed:
        await obj.replace()
    return SuccessPayloadOutput(payload=await cf_output_from_obj(obj))


@router.put('/{custom_field_id}/state-option/{option_id}')
@router.put(
    '/group/{custom_field_gid}/field/{custom_field_id}/state-option/{option_id}',
)
async def update_state_option(
    custom_field_id: PydanticObjectId,
    option_id: UUID,
    body: StateOptionUpdateBody,
) -> SuccessPayloadOutput[CustomFieldOutputRootModel]:
    option_id_ = str(option_id)
    obj: m.CustomField | None = await m.StateCustomField.find_one(
        m.StateCustomField.id == custom_field_id,
        fetch_links=True,
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    opt = next(opt for opt in obj.options if opt.id == option_id_)
    if not opt:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Option not found')
    for k, v in body.dict(exclude_unset=True).items():
        setattr(opt, k, v)
    if obj.default_value and obj.default_value.id == opt.id:
        obj.default_value = opt
    if obj.is_changed:
        await obj.replace()
        await asyncio.gather(
            m.IssueDraft.update_field_option_embedded_links(obj, opt),
            m.Issue.update_field_option_embedded_links(obj, opt),
        )
    return SuccessPayloadOutput(payload=await cf_output_from_obj(obj))


@router.delete('/{custom_field_id}/state-option/{option_id}')
@router.delete(
    '/group/{custom_field_gid}/field/{custom_field_id}/state-option/{option_id}',
)
async def remove_state_option(
    custom_field_id: PydanticObjectId,
    option_id: UUID,
) -> SuccessPayloadOutput[CustomFieldOutputRootModel]:
    option_id_ = str(option_id)
    obj: m.CustomField | None = await m.StateCustomField.find_one(
        m.StateCustomField.id == custom_field_id,
        fetch_links=True,
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    opt = next(opt for opt in obj.options if opt.id == option_id_)
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
    return SuccessPayloadOutput(payload=await cf_output_from_obj(obj))


@router.post('/{custom_field_id}/version-option')
@router.post('/group/{custom_field_gid}/field/{custom_field_id}/version-option')
async def add_version_option(
    custom_field_id: PydanticObjectId,
    body: VersionOptionCreateBody,
) -> SuccessPayloadOutput[CustomFieldOutputRootModel]:
    obj: m.CustomField | None = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id,
        with_children=True,
        fetch_links=True,
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if obj.type not in (m.CustomFieldTypeT.VERSION, m.CustomFieldTypeT.VERSION_MULTI):
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            'Custom field is not of type VERSION or VERSION_MULTI',
        )
    if any(opt.value == body.value for opt in obj.options):
        raise HTTPException(HTTPStatus.CONFLICT, 'Option already added')
    obj.options.append(
        m.VersionOption(
            id=str(uuid4()),
            value=body.value,
            release_date=datetime.combine(body.release_date, datetime.min.time())
            if body.release_date
            else None,
            is_released=body.is_released,
            is_archived=body.is_archived,
        ),
    )
    if obj.is_changed:
        await obj.replace()
    return SuccessPayloadOutput(payload=await cf_output_from_obj(obj))


@router.put('/{custom_field_id}/version-option/{option_id}')
@router.put(
    '/group/{custom_field_gid}/field/{custom_field_id}/version-option/{option_id}',
)
async def update_version_option(
    custom_field_id: PydanticObjectId,
    option_id: UUID,
    body: VersionOptionUpdateBody,
) -> SuccessPayloadOutput[CustomFieldOutputRootModel]:
    option_id_ = str(option_id)
    obj: m.CustomField | None = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id,
        with_children=True,
        fetch_links=True,
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if obj.type not in (m.CustomFieldTypeT.VERSION, m.CustomFieldTypeT.VERSION_MULTI):
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            'Custom field is not of type VERSION or VERSION_MULTI',
        )
    opt = next(opt for opt in obj.options if opt.id == option_id_)
    if not opt:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Option not found')
    for k, value in body.dict(exclude_unset=True).items():
        if k == 'release_date':
            processed_value = (
                datetime.combine(value, datetime.min.time()) if value else None
            )
            setattr(opt, k, processed_value)
        else:
            setattr(opt, k, value)
    if obj.default_value and obj.default_value.id == opt.id:
        obj.default_value = opt
    if obj.is_changed:
        await obj.replace()
        await asyncio.gather(
            m.IssueDraft.update_field_option_embedded_links(obj, opt),
            m.Issue.update_field_option_embedded_links(obj, opt),
        )
    return SuccessPayloadOutput(payload=await cf_output_from_obj(obj))


@router.delete('/{custom_field_id}/version-option/{option_id}')
@router.delete(
    '/group/{custom_field_gid}/field/{custom_field_id}/version-option/{option_id}',
)
async def remove_version_option(
    custom_field_id: PydanticObjectId,
    option_id: UUID,
) -> SuccessPayloadOutput[CustomFieldOutputRootModel]:
    option_id_ = str(option_id)
    obj: m.CustomField | None = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id,
        with_children=True,
        fetch_links=True,
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if obj.type not in (m.CustomFieldTypeT.VERSION, m.CustomFieldTypeT.VERSION_MULTI):
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            'Custom field is not of type VERSION or VERSION_MULTI',
        )
    opt = next(opt for opt in obj.options if opt.id == option_id_)
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
    return SuccessPayloadOutput(payload=await cf_output_from_obj(obj))


@router.post('/{custom_field_id}/owned-option')
@router.post('/group/{custom_field_gid}/field/{custom_field_id}/owned-option')
async def add_owned_option(
    custom_field_id: PydanticObjectId,
    body: OwnedOptionCreateBody,
) -> SuccessPayloadOutput[CustomFieldOutputRootModel]:
    obj: m.CustomField | None = await m.OwnedCustomField.find_one(
        m.OwnedCustomField.id == custom_field_id,
        fetch_links=True,
    )
    if not obj:
        obj = await m.OwnedMultiCustomField.find_one(
            m.OwnedMultiCustomField.id == custom_field_id,
            fetch_links=True,
        )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if any(opt.value == body.value for opt in obj.options):
        raise HTTPException(HTTPStatus.CONFLICT, 'Option already added')

    owner = None
    if body.owner:
        owner = await m.User.find_one(m.User.id == body.owner, fetch_links=True)
        if not owner:
            raise HTTPException(HTTPStatus.NOT_FOUND, 'Owner user not found')
        owner = m.UserLinkField.from_obj(owner)

    obj.options.append(
        m.OwnedOption(
            id=str(uuid4()),
            value=body.value,
            owner=owner,
            color=body.color,
            is_archived=body.is_archived,
        ),
    )
    if obj.is_changed:
        await obj.replace()
    return SuccessPayloadOutput(payload=await cf_output_from_obj(obj))


@router.put('/{custom_field_id}/owned-option/{option_id}')
@router.put(
    '/group/{custom_field_gid}/field/{custom_field_id}/owned-option/{option_id}',
)
async def update_owned_option(
    custom_field_id: PydanticObjectId,
    option_id: UUID,
    body: OwnedOptionUpdateBody,
) -> SuccessPayloadOutput[CustomFieldOutputRootModel]:
    option_id_ = str(option_id)
    obj: m.CustomField | None = await m.OwnedCustomField.find_one(
        m.OwnedCustomField.id == custom_field_id,
        fetch_links=True,
    )
    if not obj:
        obj = await m.OwnedMultiCustomField.find_one(
            m.OwnedMultiCustomField.id == custom_field_id,
            fetch_links=True,
        )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    opt = next((opt for opt in obj.options if opt.id == option_id_), None)
    if not opt:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Option not found')

    for k, v in body.dict(exclude_unset=True).items():
        if k == 'owner':
            if v:
                owner = await m.User.find_one(m.User.id == v, fetch_links=True)
                if not owner:
                    raise HTTPException(HTTPStatus.NOT_FOUND, 'Owner user not found')
                setattr(opt, k, m.UserLinkField.from_obj(owner))
            else:
                setattr(opt, k, None)
        else:
            setattr(opt, k, v)

    if obj.default_value and obj.default_value.id == opt.id:
        obj.default_value = opt
    if obj.is_changed:
        await obj.replace()
        await asyncio.gather(
            m.IssueDraft.update_field_option_embedded_links(obj, opt),
            m.Issue.update_field_option_embedded_links(obj, opt),
        )
    return SuccessPayloadOutput(payload=await cf_output_from_obj(obj))


@router.delete('/{custom_field_id}/owned-option/{option_id}')
@router.delete(
    '/group/{custom_field_gid}/field/{custom_field_id}/owned-option/{option_id}',
)
async def remove_owned_option(
    custom_field_id: PydanticObjectId,
    option_id: UUID,
) -> SuccessPayloadOutput[CustomFieldOutputRootModel]:
    option_id_ = str(option_id)
    obj: m.CustomField | None = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id,
        with_children=True,
        fetch_links=True,
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if obj.type not in (m.CustomFieldTypeT.OWNED, m.CustomFieldTypeT.OWNED_MULTI):
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            'Custom field is not of type OWNED or OWNED_MULTI',
        )
    opt = next((opt for opt in obj.options if opt.id == option_id_), None)
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
    return SuccessPayloadOutput(payload=await cf_output_from_obj(obj))


@router.get('/{custom_field_id}/select')
@router.get('/group/{custom_field_gid}/field/{custom_field_id}/select')
async def select_options(
    custom_field_id: PydanticObjectId,
    query: SelectParams = Depends(),
) -> BaseListOutput[CustomFieldSelectOptionsT]:
    obj = await m.CustomField.find_one(
        m.CustomField.id == custom_field_id,
        with_children=True,
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if isinstance(obj, m.UserCustomField | m.UserMultiCustomField):
        available_users = await obj.resolve_available_users()
        selected = user_link_select(list(available_users), query)
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
    if isinstance(obj, m.OwnedCustomField | m.OwnedMultiCustomField):
        selected = enum_option_select(obj.options, query)
        return BaseListOutput.make(
            count=selected.total,
            limit=selected.limit,
            offset=selected.offset,
            items=[OwnedOptionOutput.from_obj(opt) for opt in selected.items],
        )
    if isinstance(obj, m.SprintCustomField | m.SprintMultiCustomField):
        selected = enum_option_select(obj.options, query)
        return BaseListOutput.make(
            count=selected.total,
            limit=selected.limit,
            offset=selected.offset,
            items=[SprintOptionOutput.from_obj(opt) for opt in selected.items],
        )
    raise HTTPException(HTTPStatus.BAD_REQUEST, 'Custom field is not selectable')


@router.get('/group/{custom_field_gid}/select')
async def select_options_group(
    custom_field_gid: str,
    query: SelectParams = Depends(),
) -> BaseListOutput[CustomFieldGroupSelectOptionsT]:
    fields = await m.CustomField.find(
        m.CustomField.gid == custom_field_gid,
        with_children=True,
    ).to_list()

    if not fields:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field group not found')

    if fields[0].type in (m.CustomFieldTypeT.VERSION, m.CustomFieldTypeT.VERSION_MULTI):
        select_fn = version_option_select
        output_fn = ShortOptionOutput.from_obj
        all_options = {opt for field in fields for opt in field.options}
    elif fields[0].type in (
        m.CustomFieldTypeT.ENUM,
        m.CustomFieldTypeT.ENUM_MULTI,
        m.CustomFieldTypeT.OWNED,
        m.CustomFieldTypeT.OWNED_MULTI,
        m.CustomFieldTypeT.SPRINT,
        m.CustomFieldTypeT.SPRINT_MULTI,
    ):
        select_fn = enum_option_select
        output_fn = ShortOptionOutput.from_obj
        all_options = {opt for field in fields for opt in field.options}
    elif fields[0].type == m.CustomFieldTypeT.STATE:
        select_fn = state_option_select
        output_fn = ShortOptionOutput.from_obj
        all_options = {opt for field in fields for opt in field.options}
    elif fields[0].type in (m.CustomFieldTypeT.USER, m.CustomFieldTypeT.USER_MULTI):
        select_fn = user_link_select
        output_fn = UserFieldValueOutput.from_obj
        all_options = set()
        for field in fields:
            field_users = await field.resolve_available_users()
            all_options.update(field_users)
    else:
        raise HTTPException(HTTPStatus.BAD_REQUEST, 'Custom field is not selectable')

    if any(field.is_nullable for field in fields):
        all_options.add(None)

    selected = select_fn(all_options, query)

    return BaseListOutput.make(
        count=selected.total,
        limit=selected.limit,
        offset=selected.offset,
        items=[output_fn(opt) for opt in selected.items],
    )


@router.post('/{custom_field_id}/sprint-option')
@router.post('/group/{custom_field_gid}/field/{custom_field_id}/sprint-option')
async def add_sprint_option(
    custom_field_id: PydanticObjectId,
    body: SprintOptionCreateBody,
) -> SuccessPayloadOutput[CustomFieldOutputRootModel]:
    obj: m.CustomField | None = await m.SprintCustomField.find_one(
        m.SprintCustomField.id == custom_field_id,
        fetch_links=True,
    )
    if not obj:
        obj = await m.SprintMultiCustomField.find_one(
            m.SprintMultiCustomField.id == custom_field_id,
            fetch_links=True,
        )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    if any(opt.value == body.value for opt in obj.options):
        raise HTTPException(HTTPStatus.CONFLICT, 'Option already added')
    obj.options.append(
        m.SprintOption(
            id=str(uuid4()),
            value=body.value,
            is_completed=body.is_completed,
            is_archived=body.is_archived,
            color=body.color,
            planed_start_date=datetime.combine(
                body.planed_start_date, datetime.min.time()
            )
            if body.planed_start_date
            else None,
            planed_end_date=datetime.combine(body.planed_end_date, datetime.min.time())
            if body.planed_end_date
            else None,
            start_date=datetime.combine(body.start_date, datetime.min.time())
            if body.start_date
            else None,
            end_date=datetime.combine(body.end_date, datetime.min.time())
            if body.end_date
            else None,
            description=body.description,
        ),
    )
    if obj.is_changed:
        await obj.replace()
    return SuccessPayloadOutput(payload=await cf_output_from_obj(obj))


@router.put('/{custom_field_id}/sprint-option/{option_id}')
@router.put(
    '/group/{custom_field_gid}/field/{custom_field_id}/sprint-option/{option_id}',
)
async def update_sprint_option(
    custom_field_id: PydanticObjectId,
    option_id: UUID,
    body: SprintOptionUpdateBody,
) -> SuccessPayloadOutput[CustomFieldOutputRootModel]:
    option_id_ = str(option_id)
    obj: m.CustomField | None = await m.SprintCustomField.find_one(
        m.SprintCustomField.id == custom_field_id,
        fetch_links=True,
    )
    if not obj:
        obj = await m.SprintMultiCustomField.find_one(
            m.SprintMultiCustomField.id == custom_field_id,
            fetch_links=True,
        )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    opt = next((opt for opt in obj.options if opt.id == option_id_), None)
    if not opt:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Option not found')
    for k, value in body.dict(exclude_unset=True).items():
        if k in ('planed_start_date', 'planed_end_date', 'start_date', 'end_date'):
            processed_value = (
                datetime.combine(value, datetime.min.time()) if value else None
            )
            setattr(opt, k, processed_value)
        else:
            setattr(opt, k, value)
    if obj.default_value and obj.default_value.id == opt.id:
        obj.default_value = opt
    if obj.is_changed:
        await obj.replace()
        await asyncio.gather(
            m.IssueDraft.update_field_option_embedded_links(obj, opt),
            m.Issue.update_field_option_embedded_links(obj, opt),
        )
    return SuccessPayloadOutput(payload=await cf_output_from_obj(obj))


@router.delete('/{custom_field_id}/sprint-option/{option_id}')
@router.delete(
    '/group/{custom_field_gid}/field/{custom_field_id}/sprint-option/{option_id}',
)
async def remove_sprint_option(
    custom_field_id: PydanticObjectId,
    option_id: UUID,
) -> SuccessPayloadOutput[CustomFieldOutputRootModel]:
    option_id_ = str(option_id)
    obj: m.CustomField | None = await m.SprintCustomField.find_one(
        m.SprintCustomField.id == custom_field_id,
        fetch_links=True,
    )
    if not obj:
        obj = await m.SprintMultiCustomField.find_one(
            m.SprintMultiCustomField.id == custom_field_id,
            fetch_links=True,
        )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Custom field not found')
    opt = next((opt for opt in obj.options if opt.id == option_id_), None)
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
    return SuccessPayloadOutput(payload=await cf_output_from_obj(obj))


async def count_issues_with_option(
    custom_field_id: PydanticObjectId,
    option_id: str,
) -> int:
    return await m.Issue.find(
        {'fields': {'$elemMatch': {'id': custom_field_id, 'value.id': option_id}}},
    ).count()

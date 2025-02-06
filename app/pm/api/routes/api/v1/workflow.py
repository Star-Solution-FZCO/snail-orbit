from http import HTTPStatus
from typing import Self, Union

from beanie import PydanticObjectId
from croniter import croniter
from fastapi import Depends, HTTPException
from pydantic import BaseModel

import pm.models as m
from pm.api.context import admin_context_dependency
from pm.api.utils.router import APIRouter
from pm.api.views.output import BaseListOutput, ModelIdOutput, SuccessPayloadOutput
from pm.api.views.params import ListParams

__all__ = ('router',)


router = APIRouter(
    prefix='/workflow',
    tags=['workflow'],
    dependencies=[Depends(admin_context_dependency)],
)


class WorkflowOutput(BaseModel):
    id: PydanticObjectId
    name: str
    description: str | None
    type: m.WorkflowType

    @classmethod
    def from_obj(cls, obj: m.Workflow) -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
            type=obj.type,
        )


class ScheduledWorkflowOutput(WorkflowOutput):
    schedule: str

    @classmethod
    def from_obj(cls, obj: m.ScheduledWorkflow) -> Self:
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
            type=obj.type,
            schedule=obj.schedule,
        )


class WorkflowCreate(BaseModel):
    name: str
    description: str | None = None
    type: m.WorkflowType
    script: str
    schedule: str | None = None


class WorkflowUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    script: str | None = None
    schedule: str | None = None


def output_from_obj(obj: m.Workflow) -> WorkflowOutput:
    if isinstance(obj, m.ScheduledWorkflow):
        return ScheduledWorkflowOutput.from_obj(obj)
    return WorkflowOutput.from_obj(obj)


@router.get('/list')
async def list_workflow(
    query: ListParams = Depends(),
) -> BaseListOutput[Union[WorkflowOutput, ScheduledWorkflowOutput]]:
    q = m.Workflow.find(with_children=True).sort(m.Workflow.name)
    return await BaseListOutput.make_from_query(
        q,
        limit=query.limit,
        offset=query.offset,
        projection_fn=output_from_obj,
    )


@router.get('/{workflow_id}')
async def get_workflow(
    workflow_id: PydanticObjectId,
) -> SuccessPayloadOutput[Union[WorkflowOutput, ScheduledWorkflowOutput]]:
    obj = await m.Workflow.find_one(m.Workflow.id == workflow_id, with_children=True)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Workflow not found')
    return SuccessPayloadOutput(payload=output_from_obj(obj))


@router.delete('/{workflow_id}')
async def delete_workflow(workflow_id: PydanticObjectId):
    obj = await m.Workflow.get(workflow_id, with_children=True)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Workflow not found')
    await obj.delete()
    return ModelIdOutput.from_obj(obj)


@router.post('/')
async def create_workflow(
    body: WorkflowCreate,
) -> SuccessPayloadOutput[Union[WorkflowOutput, ScheduledWorkflowOutput]]:
    if body.type == m.WorkflowType.SCHEDULED:
        if not body.schedule:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST, 'Schedule is required for scheduled workflow'
            )
        if not croniter.is_valid(body.schedule):
            raise HTTPException(
                HTTPStatus.BAD_REQUEST, 'Schedule should be valid cron expression'
            )
        obj = m.ScheduledWorkflow(**body.model_dump(exclude_unset=True))
    else:
        obj = m.OnChangeWorkflow(**body.model_dump(exclude_unset=True))
    await obj.insert()
    return SuccessPayloadOutput(payload=output_from_obj(obj))


@router.put('/{workflow_id}')
async def update_workflow(
    workflow_id: PydanticObjectId, body: WorkflowUpdate
) -> SuccessPayloadOutput[Union[WorkflowOutput, ScheduledWorkflowOutput]]:
    obj = await m.Workflow.get(workflow_id, with_children=True)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Workflow not found')
    update_data = body.dict(exclude_unset=True)
    for k, v in update_data.items():
        setattr(obj, k, v)
        if isinstance(obj, m.ScheduledWorkflow) and 'schedule' in update_data:
            if not croniter.is_valid(body.schedule):
                raise HTTPException(
                    HTTPStatus.BAD_REQUEST, 'Schedule should be valid cron expression'
                )
            obj.schedule = body.schedule
    if obj.is_changed:
        await obj.save_changes()
    return SuccessPayloadOutput(payload=output_from_obj(obj))

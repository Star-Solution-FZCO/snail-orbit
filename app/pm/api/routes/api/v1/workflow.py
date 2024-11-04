from http import HTTPStatus
from typing import Self

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel

import pm.models as m
from pm.api.context import current_user_context_dependency
from pm.api.utils.router import APIRouter
from pm.api.views.output import BaseListOutput, SuccessPayloadOutput
from pm.api.views.params import ListParams

__all__ = ('router',)


router = APIRouter(
    prefix='/workflow',
    tags=['workflow'],
    dependencies=[Depends(current_user_context_dependency)],
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


def output_from_obj(obj: m.Workflow) -> WorkflowOutput:
    if isinstance(obj, m.ScheduledWorkflow):
        return ScheduledWorkflowOutput.from_obj(obj)
    return WorkflowOutput.from_obj(obj)


@router.get('/list')
async def list_workflow(
    query: ListParams = Depends(),
) -> BaseListOutput[WorkflowOutput]:
    q = m.Workflow.find(with_children=True).sort(m.Workflow.name)
    return BaseListOutput.make(
        count=await q.count(),
        limit=query.limit,
        offset=query.offset,
        items=[
            output_from_obj(obj)
            async for obj in q.limit(query.limit).skip(query.offset)
        ],
    )


@router.get('/{workflow_id}')
async def get_workflow(
    workflow_id: PydanticObjectId,
) -> SuccessPayloadOutput[WorkflowOutput]:
    obj = await m.Workflow.find_one(m.Workflow.id == workflow_id, with_children=True)
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Workflow not found')
    return SuccessPayloadOutput(payload=output_from_obj(obj))

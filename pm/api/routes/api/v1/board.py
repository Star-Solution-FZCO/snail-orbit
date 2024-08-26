from http import HTTPStatus

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from pydantic import BaseModel

import pm.models as m
from pm.api.context import current_user_context_dependency
from pm.api.search.issue import transform_query
from pm.api.utils.router import APIRouter
from pm.api.views.factories.crud import CrudCreateBody, CrudOutput, CrudUpdateBody
from pm.api.views.issue import IssueOutput
from pm.api.views.output import BaseListOutput, ModelIdOutput, SuccessPayloadOutput
from pm.api.views.params import ListParams

__all__ = ('router',)

router = APIRouter(
    prefix='/board',
    tags=['board'],
    dependencies=[Depends(current_user_context_dependency)],
)


class BoardOutput(CrudOutput[m.Board]):
    name: str
    description: str | None
    query: str | None
    column_field: str | None
    columns: list[str]


class BoardCreate(CrudCreateBody[m.Board]):
    name: str
    description: str | None = None
    query: str | None = None
    column_field: str | None = None
    columns: list[str]


class BoardUpdate(CrudUpdateBody[m.Board]):
    name: str | None = None
    description: str | None = None
    query: str | None = None
    column_field: str | None = None
    columns: list[str] | None = None


class ColumnOutput(BaseModel):
    name: str
    issues: list[IssueOutput]


@router.get('/list')
async def list_boards(
    query: ListParams = Depends(),
) -> BaseListOutput[BoardOutput]:
    q = m.Board.find().sort(m.Board.name)
    results = []
    async for obj in q.limit(query.limit).skip(query.offset):
        results.append(BoardOutput.from_obj(obj))
    return BaseListOutput.make(
        count=await q.count(),
        limit=query.limit,
        offset=query.offset,
        items=results,
    )


@router.post('')
async def create_board(
    body: BoardCreate,
) -> SuccessPayloadOutput[BoardOutput]:
    board = m.Board(
        name=body.name,
        description=body.description,
        query=body.query,
        column_field=body.column_field,
        columns=body.columns,
    )
    await board.insert()
    return SuccessPayloadOutput(payload=BoardOutput.from_obj(board))


@router.get('/{board_id}')
async def get_board(
    board_id: PydanticObjectId,
) -> SuccessPayloadOutput[BoardOutput]:
    board = await m.Board.find_one(m.Board.id == board_id)
    if not board:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Board not found')
    return SuccessPayloadOutput(payload=BoardOutput.from_obj(board))


@router.put('/{board_id}')
async def update_board(
    board_id: PydanticObjectId,
    body: BoardUpdate,
) -> SuccessPayloadOutput[BoardOutput]:
    board = await m.Board.find_one(m.Board.id == board_id)
    if not board:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Board not found')
    body.update_obj(board)
    if board.is_changed:
        await board.save_changes()
    return SuccessPayloadOutput(payload=BoardOutput.from_obj(board))


@router.delete('/{board_id}')
async def delete_board(
    board_id: PydanticObjectId,
) -> ModelIdOutput:
    board = await m.Board.find_one(m.Board.id == board_id)
    if not board:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Board not found')
    await board.delete()
    return ModelIdOutput.make(board_id)


@router.get('/{board_id}/issues')
async def get_board_issues(
    board_id: PydanticObjectId,
) -> BaseListOutput[ColumnOutput]:
    board: m.Board | None = await m.Board.find_one(m.Board.id == board_id)
    if not board:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Board not found')
    flt = {}
    if board.query:
        flt, _ = transform_query(board.query)
    results = {col: [] for col in board.columns}
    for issue in await m.Issue.find(flt).sort(m.Issue.id).to_list():
        if (
            board.column_field in issue.fields
            and issue.fields[board.column_field].value in results
        ):
            results[issue.fields[board.column_field].value].append(issue)
    priorities = {id_: idx for idx, id_ in enumerate(board.issues_order)}
    for issues in results.values():
        issues.sort(key=lambda i: priorities.get(i.id, float('inf')))
    return BaseListOutput.make(
        count=len(results),
        limit=len(results),
        offset=0,
        items=[
            ColumnOutput(
                name=col,
                issues=[IssueOutput.from_obj(issue) for issue in issues],
            )
            for col, issues in results.items()
        ],
    )

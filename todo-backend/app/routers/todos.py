from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.repository import NotFoundError, TodoRepository
from app.schemas import TodoCreate, TodoResponse, TodoUpdate

router = APIRouter(prefix="/api/v1/todos", tags=["todos"])


async def get_repo(
    session: AsyncSession = Depends(get_session),
) -> TodoRepository:
    return TodoRepository(session)


@router.get("")
async def list_todos(
    repo: TodoRepository = Depends(get_repo),
) -> dict[str, list[TodoResponse]]:
    todos = await repo.get_all()
    return {"items": todos}


@router.post("", status_code=201)
async def create_todo(
    data: TodoCreate,
    repo: TodoRepository = Depends(get_repo),
) -> TodoResponse:
    return await repo.create(data)


@router.patch("/{todo_id}")
async def update_todo(
    todo_id: int,
    data: TodoUpdate,
    repo: TodoRepository = Depends(get_repo),
) -> TodoResponse:
    try:
        return await repo.update(todo_id, data)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Todo not found")


@router.delete("/{todo_id}", status_code=204)
async def delete_todo(
    todo_id: int,
    repo: TodoRepository = Depends(get_repo),
) -> Response:
    try:
        await repo.delete(todo_id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Todo not found")
    return Response(status_code=204)

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import TodoCreate, TodoResponse, TodoUpdate


class NotFoundError(Exception):
    pass


class TodoRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_all(self) -> list[TodoResponse]:
        raise NotImplementedError("Implemented in Story 2.2")

    async def create(self, data: TodoCreate) -> TodoResponse:
        raise NotImplementedError("Implemented in Story 2.2")

    async def update(self, id: int, data: TodoUpdate) -> TodoResponse:
        raise NotImplementedError("Implemented in Story 2.2")

    async def delete(self, id: int) -> None:
        raise NotImplementedError("Implemented in Story 2.2")

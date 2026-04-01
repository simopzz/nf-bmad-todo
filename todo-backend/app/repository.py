from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import TodoRecord
from app.schemas import TodoCreate, TodoResponse, TodoUpdate


class NotFoundError(Exception):
    pass


class TodoRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_all(self) -> list[TodoResponse]:
        result = await self.session.execute(
            select(TodoRecord).order_by(TodoRecord.created_at.desc())
        )
        records = result.scalars().all()
        return [
            TodoResponse(
                id=r.id,
                title=r.title,
                completed=r.completed,
                created_at=r.created_at,
            )
            for r in records
        ]

    async def create(self, data: TodoCreate) -> TodoResponse:
        record = TodoRecord(title=data.title, completed=False)
        self.session.add(record)
        await self._commit_and_refresh(record)
        return TodoResponse(
            id=record.id,
            title=record.title,
            completed=record.completed,
            created_at=record.created_at,
        )

    async def update(self, id: int, data: TodoUpdate) -> TodoResponse:
        result = await self.session.execute(select(TodoRecord).where(TodoRecord.id == id))
        record = result.scalar_one_or_none()
        if record is None:
            raise NotFoundError(f"Todo {id} not found")
        if data.title is not None:
            record.title = data.title
        if data.completed is not None:
            record.completed = data.completed
        await self._commit_and_refresh(record)
        return TodoResponse(
            id=record.id,
            title=record.title,
            completed=record.completed,
            created_at=record.created_at,
        )

    async def delete(self, id: int) -> None:
        result = await self.session.execute(select(TodoRecord).where(TodoRecord.id == id))
        record = result.scalar_one_or_none()
        if record is None:
            raise NotFoundError(f"Todo {id} not found")
        await self.session.delete(record)
        await self._commit()

    async def _commit(self) -> None:
        try:
            await self.session.commit()
        except SQLAlchemyError:
            await self.session.rollback()
            raise

    async def _commit_and_refresh(self, record: TodoRecord) -> None:
        await self._commit()
        try:
            await self.session.refresh(record)
        except SQLAlchemyError:
            await self.session.rollback()
            raise

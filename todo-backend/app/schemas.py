from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class TodoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    model_config = ConfigDict(extra="forbid")

    @field_validator("title")
    @classmethod
    def title_must_not_be_whitespace_only(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Title must not be empty or whitespace-only")
        return value.strip()


class TodoUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    completed: bool | None = None
    model_config = ConfigDict(extra="forbid")

    @field_validator("title")
    @classmethod
    def title_must_not_be_whitespace_only(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Title must not be empty or whitespace-only")
        return value.strip()

    @model_validator(mode="after")
    def at_least_one_field(self) -> "TodoUpdate":
        if self.title is None and self.completed is None:
            raise ValueError("At least one of 'title' or 'completed' must be provided")
        return self


class TodoResponse(BaseModel):
    id: int
    title: str
    completed: bool
    created_at: datetime

import asyncio

import pytest
from httpx import AsyncClient


async def test_get_todos_empty(client: AsyncClient) -> None:
    r = await client.get("/api/v1/todos")
    assert r.status_code == 200
    assert r.json() == {"items": []}


async def test_get_todos_ordered_newest_first(client: AsyncClient) -> None:
    await client.post("/api/v1/todos", json={"title": "First"})
    await asyncio.sleep(1)  # ensure different created_at (SQLite second-level precision)
    await client.post("/api/v1/todos", json={"title": "Second"})

    r = await client.get("/api/v1/todos")
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) == 2
    assert items[0]["title"] == "Second"  # newest first
    assert items[1]["title"] == "First"


async def test_create_todo_valid(client: AsyncClient) -> None:
    r = await client.post("/api/v1/todos", json={"title": "Buy groceries"})
    assert r.status_code == 201
    body = r.json()
    assert body["title"] == "Buy groceries"
    assert body["completed"] is False
    assert "id" in body
    assert "created_at" in body


@pytest.mark.parametrize("title", ["", "   "], ids=["empty", "whitespace"])
async def test_create_todo_invalid_title(client: AsyncClient, title: str) -> None:
    r = await client.post("/api/v1/todos", json={"title": title})
    assert r.status_code == 422


@pytest.mark.parametrize(
    ("patch_payload", "expected_title", "expected_completed"),
    [
        ({"title": "Updated"}, "Updated", False),
        ({"completed": True}, "Original", True),
        ({"completed": False}, "Original", False),
        ({"title": "New", "completed": True}, "New", True),
    ],
    ids=["title_only", "completed_only", "uncomplete", "both_fields"],
)
async def test_patch_todo_success(
    client: AsyncClient,
    patch_payload: dict[str, object],
    expected_title: str,
    expected_completed: bool,
) -> None:
    create_r = await client.post("/api/v1/todos", json={"title": "Original"})
    todo_id = create_r.json()["id"]

    r = await client.patch(f"/api/v1/todos/{todo_id}", json=patch_payload)
    assert r.status_code == 200
    assert r.json()["title"] == expected_title
    assert r.json()["completed"] is expected_completed


@pytest.mark.parametrize("method", ["patch", "delete"])
async def test_unknown_id_returns_404(client: AsyncClient, method: str) -> None:
    request = getattr(client, method)
    kwargs: dict[str, object] = {}
    if method == "patch":
        kwargs["json"] = {"title": "Nope"}
    r = await request("/api/v1/todos/99999", **kwargs)
    assert r.status_code == 404
    assert r.json() == {"detail": "Todo not found"}


async def test_delete_todo_success(client: AsyncClient) -> None:
    create_r = await client.post("/api/v1/todos", json={"title": "To delete"})
    todo_id = create_r.json()["id"]

    r = await client.delete(f"/api/v1/todos/{todo_id}")
    assert r.status_code == 204

    verify_r = await client.patch(f"/api/v1/todos/{todo_id}", json={"title": "Should fail"})
    assert verify_r.status_code == 404
    assert verify_r.json() == {"detail": "Todo not found"}

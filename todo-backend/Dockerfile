FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS build

WORKDIR /build

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app

RUN groupadd --system appuser \
    && useradd --system --gid appuser --home-dir /app --create-home appuser \
    && mkdir -p /app/data \
    && chown -R appuser:appuser /app

COPY --from=build /build/.venv /app/.venv

HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=10s \
  CMD python -c "import http.client,sys; c=http.client.HTTPConnection('localhost', 8000, timeout=3); c.request('GET', '/api/v1/health'); r=c.getresponse(); sys.exit(0 if r.status in (200, 404) else 1)"

COPY --chown=appuser:appuser app/ app/

USER appuser

EXPOSE 8000

# Story 2 introduces the FastAPI app module; for Story 1.3 we only need a running process.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]

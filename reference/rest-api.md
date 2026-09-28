---
title: REST API
description: "Reference for the REST API exposed by the experimental sprocket dev server command."
---

# REST API

::: danger Caution
This API is part of the beta release of the [`server`](/reference/cli/dev/server)
command. This functionality is considered experimental and may change in future
releases.
:::

The server exposes a REST API for managing workflow executions. Interactive
documentation is available at `/api/v1/swagger-ui` when the server is running,
and the OpenAPI specification can be retrieved from `/api/v1/openapi.json`.

To start a server, see [`sprocket dev server`](/reference/cli/dev/server). To
submit a run from the command line instead of calling the API directly, see
[`sprocket dev server submit`](/reference/cli/dev/server-submit).

## Server

- `GET /api/v1/info` - Get server metadata.

## Runs

Runs represent individual workflow executions.

- `POST /api/v1/runs` - Submit a new workflow.
- `GET /api/v1/runs` - List all runs. Supports optional `?status=` filter
  (e.g., `?status=running`).
- `GET /api/v1/runs/{uuid}` - Get run details.
- `POST /api/v1/runs/{uuid}/cancel` - Cancel a running workflow.
- `GET /api/v1/runs/{uuid}/outputs` - Get run outputs.
- `GET /api/v1/runs/{uuid}/tasks` - List a run's tasks. Supports pagination and
  an optional `?status=` filter.
- `GET /api/v1/runs/{uuid}/tasks/counts` - Get per-status task counts for a run.

## Sessions

Sessions group related workflow submissions. Each `sprocket run` invocation
creates its own session, while a running `sprocket dev server start` instance
creates a single session at startup that is shared by all workflows submitted to
it.

- `GET /api/v1/sessions` - List sessions.
- `GET /api/v1/sessions/{uuid}` - Get session details.

## Tasks

Tasks represent individual task executions within a workflow run.

- `GET /api/v1/tasks` - List tasks.
- `GET /api/v1/tasks/{name}` - Get task details.
- `GET /api/v1/tasks/{name}/logs` - Get task logs.

## Example usage

### Starting the server

```shell
# Start server allowing workflows from a local directory
sprocket dev server start \
  --allowed-file-paths /home/user/workflows \
  --port 8080

# Start server allowing workflows from GitHub
sprocket dev server start \
  --allowed-urls "https://raw.githubusercontent.com/" \
  --port 8080
```

### Submitting a workflow

```shell
# Submit a workflow via the API
curl -X POST http://localhost:8080/api/v1/runs \
  -H "Content-Type: application/json" \
  -d '{
    "source": "/home/user/workflows/hello.wdl",
    "inputs": {
      "name": "World"
    }
  }'
```

### Checking run status

```shell
# Get run details
curl http://localhost:8080/api/v1/runs/{run_uuid}

# List all running workflows
curl http://localhost:8080/api/v1/runs?status=running
```

# `sprocket dev server`

> [!CAUTION]
>
> This document describes the beta release of the `server` command. This
> functionality is considered experimental and may change in future releases.

`sprocket dev server` is a group of run-management commands built around
running Sprocket as an HTTP server, enabling remote workflow submission and
monitoring through a REST API. This is useful for scenarios where you want to
submit workflows from a separate machine or integrate Sprocket into larger
systems.

The group provides the following subcommands:

| Subcommand | Description |
|--------|-------------|
| [`start`](#starting-the-server) | Run the HTTP API server for run execution. |
| [`submit`](/subcommands/submit) | Submit a workflow to a running server. |
| [`status`](#managing-runs) | Show the status of one or all runs. |
| [`inspect`](#managing-runs) | Show detailed information about a run. |
| [`cancel`](#managing-runs) | Cancel a running or queued run. |
| [`retry`](#managing-runs) | Retry a previous run, optionally with input overrides. |

## Overview

Server mode provides:

- **Remote workflow submission** via REST API.
- **Real-time monitoring** of running workflows.
- **Provenance tracking** with a SQLite database.
- **Concurrent execution** of multiple workflows.

The server shares the same execution engine as `sprocket run`, ensuring
consistent behavior between CLI and server-submitted workflows.

## Starting the server

```shell
sprocket dev server start --allowed-file-paths /path/to/workflows
```

At least one of `--allowed-file-paths` or `--allowed-urls` must be specified to
indicate where workflow sources can be loaded from.

## Command-line options

| Option | Description |
|--------|-------------|
| `--host <HOST>` | Host to bind to (default: `127.0.0.1`) |
| `--port <PORT>` | Port to bind to (default: `8080`) |
| `--database-url <URL>` | Database path. When omitted, defaults to `sprocket.db` within the output directory. When provided, relative paths resolve from the current working directory. |
| `-o, --output-dir <DIR>` | Output directory for workflow results (default: `./out`) |
| `--allowed-file-paths <PATH>` | Allowed file paths for file-based workflows (can be repeated) |
| `--allowed-urls <URL>` | Allowed URL prefixes for URL-based workflows (can be repeated) |
| `--allowed-origins <ORIGIN>` | Allowed CORS origins (can be repeated) |

## Configuration

Server settings can also be configured in `sprocket.toml`:

```toml
[server]
host = "127.0.0.1"
port = 8080
output_dir = "./out"
allowed_file_paths = ["/path/to/workflows"]
allowed_urls = ["https://raw.githubusercontent.com/"]
allowed_origins = ["http://localhost:3000"]
max_concurrent_runs = 500

[server.database]
url = "sqlite://sprocket.db"

[server.engine]
# Engine configuration (same options as [run] section)
```

### Configuration options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `host` | String | `"127.0.0.1"` | Host address to bind |
| `port` | Integer | `8080` | Port to bind |
| `output_dir` | Path | `"./out"` | Directory for workflow outputs |
| `allowed_file_paths` | List | `[]` | Allowed local paths for workflow sources |
| `allowed_urls` | List | `[]` | Allowed URL prefixes for workflow sources |
| `allowed_origins` | List | `[]` | CORS allowed origins |
| `max_concurrent_runs` | Integer | None | Maximum concurrent workflow executions |
| `database.url` | String | None | Database path. When omitted, defaults to `sprocket.db` within the output directory. When provided, relative paths resolve from the current working directory (not the output directory). |
| `engine` | Object | `{}` | Engine configuration (see execution backends) |

## Managing runs

Once a server is running, you can manage its runs from the command line without
talking to the REST API directly. These subcommands connect to the server using
the `--host` and `--port` options (falling back to the `[server]` section of
your `sprocket.toml` when not provided). A run may be referenced either by its
UUID or by its human-readable generated name (e.g. `happy-dolphin-42`).

### `status`

Show the status of one run, or list all runs when no run is given:

```shell
# List all runs
sprocket dev server status

# Show a single run, filter the list, or emit raw JSON
sprocket dev server status happy-dolphin-42
sprocket dev server status --status running --limit 50
sprocket dev server status --json
```

### `inspect`

Show detailed information about a run, including per-status task counts and the
output directory. Pass `--detailed` for a per-task breakdown, or `--json` for
the raw response:

```shell
sprocket dev server inspect happy-dolphin-42 --detailed
```

### `cancel`

Cancel a queued or running run:

```shell
sprocket dev server cancel happy-dolphin-42
```

### `retry`

Resubmit a previous run, reusing its source, target, and inputs as the base.
Any overrides use the same input syntax as
[`submit`](/subcommands/submit) (`key=value`, `@file`, and repeated keys that
append to arrays), and take precedence over the original run's values:

```shell
sprocket dev server retry happy-dolphin-42 workflow.threads=8
```

## REST API

The server exposes a REST API for managing workflow executions. Interactive
documentation is available at `/api/v1/swagger-ui` when the server is running,
and the OpenAPI specification can be retrieved from `/api/v1/openapi.json`.

### Server

- `GET /api/v1/info` - Get server metadata.

### Runs

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

### Sessions

Sessions group related workflow submissions. Each `sprocket run` invocation
creates its own session, while a running `sprocket dev server start` instance
creates a single session at startup that is shared by all workflows submitted to
it.

- `GET /api/v1/sessions` - List sessions.
- `GET /api/v1/sessions/{uuid}` - Get session details.

### Tasks

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

## Output directory

The server uses the same output directory structure as `sprocket run`. For
details on directory layout, provenance database, and output indexing, see the
[Provenance Tracking](/concepts/provenance) documentation.

## Security considerations

> [!WARNING]
>
> The Sprocket server does not perform any authentication or authorization. If you
> need to secure access to the server, you must run it behind a reverse proxy
> (e.g., nginx, Caddy, or Traefik) that handles authentication.

- Always specify `--allowed-file-paths` or `--allowed-urls` to restrict which
  workflow sources can be executed.
- Use `--allowed-origins` to configure CORS for web-based clients.
- Run behind a reverse proxy with authentication for production deployments.
- The server binds to `127.0.0.1` by default; change to `0.0.0.0` to accept
  remote connections (not recommended without a reverse proxy).

# `sprocket server`

> [!CAUTION]
>
> This document describes the beta release of the `server` command. This
> functionality is considered experimental and may change in future releases.

The `server` command starts Sprocket as an HTTP server, enabling remote workflow
submission and monitoring through a REST API. This is useful for scenarios where
you want to submit workflows from a separate machine or integrate Sprocket into
larger systems.

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
sprocket server --allowed-file-paths /path/to/workflows
```

At least one of `--allowed-file-paths` or `--allowed-urls` must be specified to
indicate where workflow sources can be loaded from.

## Command-line options

| Option | Description |
|--------|-------------|
| `--host <HOST>` | Host to bind to (default: `127.0.0.1`) |
| `--port <PORT>` | Port to bind to (default: `8080`) |
| `--database-url <URL>` | Database URL (default: `sprocket.db` in output directory) |
| `-o, --output-directory <DIR>` | Output directory for workflow results (default: `./out`) |
| `--allowed-file-paths <PATH>` | Allowed file paths for file-based workflows (can be repeated) |
| `--allowed-urls <URL>` | Allowed URL prefixes for URL-based workflows (can be repeated) |
| `--allowed-origins <ORIGIN>` | Allowed CORS origins (can be repeated) |

## Configuration

Server settings can also be configured in `sprocket.toml`:

```toml
[server]
host = "127.0.0.1"
port = 8080
output_directory = "./out"
allowed_file_paths = ["/path/to/workflows"]
allowed_urls = ["https://github.com/"]
allowed_origins = ["http://localhost:3000"]
max_concurrent_runs = 10

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
| `output_directory` | Path | `"./out"` | Directory for workflow outputs |
| `allowed_file_paths` | List | `[]` | Allowed local paths for workflow sources |
| `allowed_urls` | List | `[]` | Allowed URL prefixes for workflow sources |
| `allowed_origins` | List | `[]` | CORS allowed origins |
| `max_concurrent_runs` | Integer | None | Maximum concurrent workflow executions |
| `database.url` | String | None | Database URL (defaults to `sprocket.db` in output directory) |
| `engine` | Object | `{}` | Engine configuration (see execution backends) |

## REST API

The server exposes a REST API for managing workflow executions. Interactive
documentation is available at `/api/v1/swagger-ui` when the server is running,
and the OpenAPI specification can be retrieved from `/api/v1/openapi.json`.

### Sessions

Sessions group related workflow submissions.

- `GET /api/v1/sessions` - List sessions.
- `GET /api/v1/sessions/{uuid}` - Get session details.

### Runs

Runs represent individual workflow executions.

- `POST /api/v1/sessions/{session_uuid}/runs` - Submit a new workflow.
- `GET /api/v1/sessions/{session_uuid}/runs` - List runs in a session.
- `GET /api/v1/sessions/{session_uuid}/runs/{uuid}` - Get run details.

### Tasks

Tasks represent individual task executions within a workflow run.

- `GET /api/v1/sessions/{session_uuid}/runs/{run_uuid}/tasks` - List tasks.
- `GET /api/v1/sessions/{session_uuid}/runs/{run_uuid}/tasks/{uuid}` - Get task details.

## Example usage

### Starting the server

```shell
# Start server allowing workflows from a local directory
sprocket server \
  --allowed-file-paths /home/user/workflows \
  --port 8080

# Start server allowing workflows from GitHub
sprocket server \
  --allowed-urls "https://raw.githubusercontent.com/" \
  --port 8080
```

### Submitting a workflow

```shell
# Submit a workflow via the API
curl -X POST http://localhost:8080/api/v1/sessions/{session_uuid}/runs \
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
curl http://localhost:8080/api/v1/sessions/{session_uuid}/runs/{run_uuid}
```

## Output directory structure

The server creates an output directory with the following structure:

```
./out/
├── sprocket.db              # SQLite provenance database
├── runs/                    # Workflow execution directories
│   └── <workflow_name>/
│       └── <timestamp>/     # Individual run directory
└── index/                   # Optional symlinked organization
```

All paths in the database are stored relative to the database file, making the
entire output directory portable.

For more details on provenance tracking and output organization, see the
[Provenance Tracking](/configuration/provenance) documentation.

## Security considerations

> [!WARNING]
>
> Sprocket server does not perform any authentication or authorization. If you
> need to secure access to the server, you must run it behind a reverse proxy
> (e.g., nginx, Caddy, or Traefik) that handles authentication.

- Always specify `--allowed-file-paths` or `--allowed-urls` to restrict which
  workflow sources can be executed.
- Use `--allowed-origins` to configure CORS for web-based clients.
- Run behind a reverse proxy with authentication for production deployments.
- The server binds to `127.0.0.1` by default; change to `0.0.0.0` to accept
  remote connections (not recommended without a reverse proxy).

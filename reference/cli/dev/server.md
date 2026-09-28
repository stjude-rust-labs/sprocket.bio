---
description: "Run Sprocket as an HTTP server to submit and monitor WDL workflows remotely through a REST API with sprocket dev server."
---

# `sprocket dev server`

::: danger Caution
This document describes the beta release of the `server` command. This
functionality is considered experimental and may change in future releases.
:::

`sprocket dev server` is a group of run-management commands built around
running Sprocket as an HTTP server, enabling remote workflow submission and
monitoring through a [REST API](/reference/rest-api). This is useful for
scenarios where you want to submit workflows from a separate machine or
integrate Sprocket into larger systems.

The group provides the following subcommands:

| Subcommand | Description |
|--------|-------------|
| [`start`](#starting-the-server) | Run the HTTP API server for run execution. |
| [`submit`](/reference/cli/dev/server-submit) | Submit a workflow to a running server. |
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
All evaluations in one server process share backend resource limits and monitoring.

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
orphan_timeout_minutes = 5

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
| `orphan_timeout_minutes` | Integer | `5` | Minutes without a server heartbeat before its active runs are marked `orphaned`; must be at least `1` |
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
[`submit`](/reference/cli/dev/server-submit) (`key=value`, `@file`, and repeated keys that
append to arrays), and take precedence over the original run's values:

```shell
sprocket dev server retry happy-dolphin-42 workflow.threads=8
```

## REST API

The server exposes a REST API for managing workflow executions, covering server
metadata, runs, sessions, and tasks. Interactive documentation is available at
`/api/v1/swagger-ui` while the server is running.

See the [REST API reference](/reference/rest-api) for every endpoint and for
examples of starting a server, submitting a workflow, and checking run status
with `curl`.

## Output directory

The server uses the same output directory structure as `sprocket run`. For
details on directory layout, provenance database, and output indexing, see the
[Provenance Tracking](/concepts/provenance) documentation.

## Security considerations

::: warning
The Sprocket server does not perform any authentication or authorization. If you
need to secure access to the server, you must run it behind a reverse proxy
(e.g., nginx, Caddy, or Traefik) that handles authentication.
:::

- Always specify `--allowed-file-paths` or `--allowed-urls` to restrict which
  workflow sources can be executed.
- Use `--allowed-origins` to configure CORS for web-based clients.
- Run behind a reverse proxy with authentication for production deployments.
- The server binds to `127.0.0.1` by default; change to `0.0.0.0` to accept
  remote connections (not recommended without a reverse proxy).

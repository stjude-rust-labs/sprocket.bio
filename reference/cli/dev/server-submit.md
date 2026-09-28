---
description: "Submit a WDL task or workflow to a running Sprocket server for remote execution with the sprocket dev server submit command."
---

# `sprocket dev server submit`

::: danger Caution
This document describes the beta release of the `submit` command. This
functionality is considered experimental and may change in future releases.
:::

The `dev server submit` command is a thin wrapper around the [Sprocket Server REST
API](/reference/rest-api) that submits a WDL task or workflow to a
running Sprocket server for remote execution. It uses the same input syntax as
[`sprocket run`](/reference/cli/run#inputs), but it resolves targets more
strictly than `run` does: see [targets and input keys](#targets-and-input-keys).

## Usage

```shell
sprocket dev server submit <SOURCE> [INPUTS...] [OPTIONS]
```

The `SOURCE` argument can be a local file path, a URL, or a WDL module
directory containing a `module.json`. File paths and URLs must match the
`--allowed-file-paths` and `--allowed-urls` configured on the server.

Inputs follow the same syntax as [`sprocket run`](/reference/cli/run#inputs),
including key-value pairs, `@`-prefixed input files, and the ergonomic
[array input forms](/reference/cli/run#array-inputs).

## Targets and input keys

::: warning Important
Unlike `sprocket run`, `submit` does not infer a target. `--target` is required
when you submit a task or workflow without any inputs.
:::

Without `--target`, every input key — in files and on the command line — must
be prefixed with the name of the task or workflow being submitted. With
`--target`, Sprocket appends a `.` to the target name and prepends it to each
unqualified key, including keys inside `@`-prefixed input files. (The
`--help` text for 0.31.0 says file keys are unchanged, but in practice they are
prefixed the same way `sprocket run` prefixes them.)

## Example

Assuming a Sprocket server is running on the default host and port (see
[`sprocket dev server`](/reference/cli/dev/server)):

```shell
sprocket dev server submit example.wdl --target main name="World"
```

The command analyzes the WDL source, validates inputs locally, and then
submits the run to the server.

## Command-line options

| Option | Description |
|-|-|
| `--host <HOST>` | The hostname of the running Sprocket server. Falls back to the value in the Sprocket config when not provided. |
| `-p, --port <PORT>` | The port of the running Sprocket server. Falls back to the value in the Sprocket config when not provided. |
| `-t, --target <NAME>` | The name of the task or workflow to submit. Required if the task or workflow is submitted without any inputs. Prefixes unqualified input keys, both on the command line and inside input files. |
| `--index-on <INDEX_PATH>` | A path within the server output directory's `index/` directory to index the run outputs under. The path must be relative and cannot contain `.` or `..` components. |
| `-m, --report-mode <MODE>` | The diagnostic reporting mode (`full` or `one-line`). |
| `--locked` | Fail if `module-lock.json` is missing or out of date instead of regenerating it before submission. |

## Configuration

The `host` and `port` used to reach the Sprocket server can be set in
`sprocket.toml` under the `[server]` section, and are shared with the
[`sprocket dev server`](/reference/cli/dev/server) command:

```toml
[server]
host = "127.0.0.1"
port = 8080
```

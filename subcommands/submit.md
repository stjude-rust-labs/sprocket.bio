# `sprocket submit`

> [!CAUTION]
>
> This document describes the beta release of the `submit` command. This
> functionality is considered experimental and may change in future releases.

The `submit` command is a thin wrapper around the [Sprocket Server REST
API](/subcommands/server#rest-api) that submits a WDL task or workflow to a
running Sprocket server for remote execution. It mirrors the input and target
semantics of `sprocket run`, so most invocations can be switched between the
two commands by changing only the subcommand name.

## Usage

```shell
sprocket submit <SOURCE> [INPUTS...] [OPTIONS]
```

The `SOURCE` argument can be either a local file path or a URL, matching the
`--allowed-file-paths` and `--allowed-urls` configured on the server.

Inputs follow the same syntax as [`sprocket run`](/subcommands/run#inputs),
including key-value pairs, `@`-prefixed input files, and the ergonomic
[array input forms](/subcommands/run#array-inputs).

## Example

Assuming a Sprocket server is running on the default host and port (see
[`sprocket dev server`](/subcommands/server)):

```shell
sprocket submit example.wdl --target main name="World"
```

The command analyzes the WDL source, validates inputs locally, and then
submits the run to the server.

## Command-line options

| Option | Description |
|-|-|
| `--host <HOST>` | The hostname of the running Sprocket server. Falls back to the value in the Sprocket config when not provided. |
| `-p, --port <PORT>` | The port of the running Sprocket server. Falls back to the value in the Sprocket config when not provided. |
| `-t, --target <NAME>` | The name of the task or workflow to submit. Required if the task or workflow has no inputs. |
| `--index-on <OUTPUT_NAME>` | The output name to index on. When provided, the server indexes the run outputs using the specified output name as the key. |
| `-m, --report-mode <MODE>` | The diagnostic reporting mode. |

## Configuration

The `host` and `port` used to reach the Sprocket server can be set in
`sprocket.toml` under the `[server]` section, and are shared with the
[`sprocket dev server`](/subcommands/server) command:

```toml
[server]
host = "127.0.0.1"
port = 8080
```

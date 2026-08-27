# `sprocket dev module`

> [!CAUTION]
>
> Module management is experimental and may change in future releases.

`sprocket dev module` creates, resolves, verifies, signs, and inspects reusable WDL modules. A module is described by `module.json`; resolved dependencies are recorded in `module-lock.json`.

## Commands

| Command | Purpose |
|---|---|
| `init` | Create `module.json` and, unless `--no-scaffold` is used, starter files. |
| `add` | Add a local or Git dependency and update the lockfile. |
| `remove` | Remove a dependency and update the lockfile. |
| `lock` | Resolve missing or stale lockfile entries. |
| `update` | Resolve dependencies to newer versions allowed by the manifest. |
| `upgrade` | Raise manifest constraints and resolve the new versions. |
| `tree` | Print the resolved dependency tree. |
| `list` | Print dependencies as a flat list. |
| `verify` | Verify the current module signature and locked dependency contents. |
| `fetch` | Populate the local module cache from the lockfile. |
| `cache clean` | Remove cached module content. |
| `sign` | Sign the module and write `module.sig`. |
| `trust` | List, add, trust, or remove signing keys. |

Run `sprocket dev module <command> --help` for each command's complete options.

## Create a module

```shell
mkdir example-module
cd example-module
sprocket dev module init --name example-module --license MIT
```

By default, `init` creates `module.json`, `index.wdl`, and `README.md`. The manifest can describe authors, an entrypoint, documentation, tools, excluded paths, and dependencies. Module versions come from Git tags rather than a `version` field in `module.json`.

## Add and lock dependencies

A dependency can use a local path, a full Git URL, or hosted shorthand such as `owner/repository`:

```shell
sprocket dev module add stjude-rust-labs/example-workflows
sprocket dev module add common ../common
sprocket dev module lock --locked
```

Use `--name` to select an alias, or choose a Git revision with `--version`, `--tag`, `--branch`, or `--commit`. A commit selector may be any unique 4–40 character SHA prefix. `sprocket run` and `sprocket submit` regenerate a missing or stale lockfile before execution.

## Verify and trust modules

```shell
sprocket dev module verify
sprocket dev module verify --require-signatures --locked
sprocket dev module sign
sprocket dev module trust list
```

Signer changes require confirmation by default. `tofu` trusts the first key seen for a new dependency and prompts on later changes; `auto-accept` accepts and reports every signer change. Use `--trust-mode` on commands that update the lockfile to override the configured behavior.

## Configuration

Module resolution uses the `[modules]` table in `sprocket.toml`:

```toml
[modules]
default_git_platform = "github"
max_transfer_bytes = "2GiB"
trust_mode = "confirm"
```

`default_git_platform` controls how `owner/repository` shorthand expands. `max_transfer_bytes` caps data accepted from one Git fetch and also accepts `"unlimited"`. `trust_mode` accepts `"confirm"`, `"tofu"`, or `"auto-accept"`.

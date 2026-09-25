---
title: GitHub Action
description: "Run Sprocket checks, lints, format checks, and input validation on every pull request with the Sprocket GitHub Action."
---

<!-- Sources: https://github.com/stjude-rust-labs/sprocket-action@3eddb2126c04e5b38910821a50e4dabccb9deaf1 (README.md, action.yml) -->

# GitHub Action

The [Sprocket GitHub
Action](https://github.com/stjude-rust-labs/sprocket-action) runs select
functionality of the `sprocket` command line tool in CI/CD pipelines. It is a
Docker action, so no separate Sprocket installation step is required.

## Set up CI

A typical WDL repository checks three things on every pull request:

* **Analysis and lint.** [`sprocket check`](/reference/cli/check-lint) reports
  analysis diagnostics; adding `lint: true` also reports lint rule violations.
* **Formatting.** [`sprocket format`](/reference/cli/format) verifies that every
  document is already formatted.
* **Inputs.** [`sprocket validate`](/reference/cli/validate) checks that the
  inputs files committed to the repository still satisfy their task or workflow.

Add the action to a workflow under `.github/workflows/`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: stjude-rust-labs/sprocket-action@main
        with:
          action: lint

  format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: stjude-rust-labs/sprocket-action@main
        with:
          action: format
```

::: tip
The action is also tagged to match Sprocket releases, so you can pin a version
instead of tracking `main` — for example,
`stjude-rust-labs/sprocket-action@v0.31.0`.
:::

If an existing repository has more diagnostics than you can fix at once,
generate a [baseline](/reference/cli/check-lint#baselines) with
`sprocket lint --generate-baseline` and commit `sprocket-baseline.toml`. The
action then only fails on diagnostics that are not in the baseline, so new
problems are caught while existing ones stay recorded.

## Actions

The default `action` is to `sprocket check` all WDL documents found in the
workspace.

### `check` and `lint`

The `check` and `lint` subcommands perform static analysis on WDL documents. The
`lint: true` option additionally enables linting rules. The `lint` action is an
alias for `action: check` with linting enabled.

#### Inputs

| Input | Default | Description |
|---|---|---|
| `lint` | `false` | Whether to run linting in addition to validation. Valid choices: `"true"`, `"false"`. |
| `all-lint-rules` | `false` | Whether to enable all lint rules (adds additional rules beyond the default lint rule set). Valid choices: `"true"`, `"false"`. |
| `deny-warnings` | `false` | If specified, `sprocket check` will fail if any `warnings` are produced. Valid choices: `"true"`, `"false"`. |
| `deny-notes` | `false` | If specified, `sprocket check` will fail if any `notes` are produced. Valid choices: `"true"`, `"false"`. |
| `except` | `''` | Rules to except from all `sprocket check` reports, as a comma-separated list — for example, `CallInputSpacing,CommandSectionMixedIndentation`. Valid options are listed in the [lint rules reference](/reference/lint-rules), and upstream in [analysis rules](https://github.com/stjude-rust-labs/wdl/blob/main/wdl-analysis/RULES.md) and [lint rules](https://github.com/stjude-rust-labs/wdl/blob/main/wdl-lint/RULES.md). |
| `ignore-patterns` | `''` | Comma-separated list of patterns to append to the [`.sprocketignore`](/concepts/configuration#ignoring-wdl-files-and-directories) file in the root of the repository. |

#### Example usage

```yaml
uses: stjude-rust-labs/sprocket-action@main
with:
    action: check
    lint: true
    ignore-patterns: template,test
    except: TrailingComma,ContainerUri
```

The action `lint` can be specified and is equivalent to specifying
`action: check` and `lint: true`.

```yaml
uses: stjude-rust-labs/sprocket-action@main
with:
    action: lint
    ignore-patterns: template,test
    except: TrailingComma,ContainerUri
```

### `validate`

Validates an input JSON against a task or workflow input schema.

#### Inputs

| Input | Description |
|---|---|
| `wdl_files` | A comma-separated list of WDL documents containing a task or workflow for which to check inputs. |
| `inputs_files` | A matching comma-separated list of JSON format inputs files for the tasks or workflows. Ordering must match `wdl_files`, as no checking will be performed. |

#### Example usage

```yaml
uses: stjude-rust-labs/sprocket-action@main
with:
    action: validate
    wdl_files: "tools/bwa.wdl"
    inputs_files: "@inputs/bwa.json"
```

Multiple files can be specified as well:

```yaml
uses: stjude-rust-labs/sprocket-action@main
with:
    action: validate
    wdl_files: "tools/bwa.wdl,tools/star.wdl"
    inputs_files: "@inputs/bwa.json,@inputs/star.json"
```

::: warning Important
The action passes each `inputs_files` entry to `sprocket validate` as-is, and
Sprocket requires input files to be prefixed with `@` (see
[Inputs](/concepts/inputs#inputs)). Include the `@` on every entry, as shown
above.
:::

### `format`

Checks that all WDL files are formatted correctly.

#### Inputs

To set your format configuration (for example, indentation), commit a
`sprocket.toml` to your repository. See [Configuration](#configuration) for more
information.

| Input | Default | Description |
|---|---|---|
| `ignore-patterns` | `''` | Comma-separated list of patterns to append to the `.sprocketignore` file in the root of the repository. |

#### Example usage

```yaml
uses: stjude-rust-labs/sprocket-action@main
with:
    action: format
    ignore-patterns: template,test
```

## Configuration

The Sprocket GitHub Action will load a `sprocket.toml` in the root of your
repository, so your CI environment can use the same settings as your local
development environment. The `except`, `deny-warnings`, and `deny-notes` action
inputs correspond to the `except`, `deny_warnings`, and `deny_notes` keys in the
`[check]` table, so you can set them in your TOML instead. Action-specific
inputs, such as `action`, `skip-config-search`, `config-path`, `wdl_files`,
`inputs_files`, and `ignore-patterns`, have no `sprocket.toml` equivalent and
must stay in your workflow YAML. See the
[configuration concept page](/concepts/configuration) and the [configuration
file reference](/reference/configuration) for the available keys.

### Disabling implicit config loading

Set `skip-config-search: true` to enable the `--skip-config-search` Sprocket
option, which disables the normal configuration search. Use it together with
`config-path` to load only the specified configuration file.

### Setting an explicit config path

Use `config-path` if your config TOML is not in the root of the repository, or
if you want to add CI-specific configuration. The TOML found at this location is
the highest priority configuration. See [configuration load
order](/concepts/configuration#load-order) for more information.

| Input | Default | Description |
|---|---|---|
| `action` | `check` | The Sprocket subcommand to run. |
| `config-path` | — | Path to a TOML file to use for configuration, merged with any configuration files found in the standard load order. |
| `skip-config-search` | `false` | Disable the normal configuration search. |

## Outputs

The action sets a single output, `status`, with the status of the check.

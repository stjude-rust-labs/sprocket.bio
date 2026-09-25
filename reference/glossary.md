---
title: Glossary
description: "Definitions of the Sprocket and WDL terms used throughout this documentation."
---

# Glossary

This page defines the terms used throughout the Sprocket documentation.

## Attempt

One try to execute a task. Sprocket stores each attempt in a numbered
`attempts/<n>/` directory with its command, standard output, standard error, and
working directory. See [Retries](/concepts/provenance#retries).

## Baseline

A `sprocket-baseline.toml` file that records existing diagnostics so
`sprocket check` and `sprocket lint` can suppress them while still reporting
new diagnostics. Stale entries cause the check to fail. See
[Baselines](/reference/cli/check-lint#baselines).

## Call

A use of a task inside a workflow. During a workflow run, Sprocket gives each
task call its own directory under `calls/`, with execution attempts below it.
See [Workflow runs](/concepts/provenance#workflow-runs).

## Call cache

The persistent cache that lets Sprocket reuse the result of a previously
successful task execution with matching inputs and execution context. Call
caching is off by default, and only a task that succeeds on its first attempt
is eligible. See [Call cache](/concepts/call-caching).

## Container

The isolated environment in which Sprocket runs a task. A task selects a
container image through its WDL `container` requirement or runtime key, and the
execution backend starts the image. See [Containers](/concepts/containers).

## Diagnostic

A message produced while Sprocket parses, analyzes, lints, or formats WDL. A
diagnostic has a severity such as error, warning, or note; check and lint
options control which severities are shown or cause failure. See
[`sprocket check` and `sprocket lint`](/reference/cli/check-lint).

## Digest

A value Sprocket uses to detect file changes for the call cache. A **weak**
digest uses file metadata, a **strongish** digest uses the metadata and first
10 MiB of content, and a **strong** digest hashes the full contents. See
[Content digests](/concepts/call-caching#content-digests).

## Document

A WDL source file or URL that declares a WDL version and can contain imports,
structs, tasks, and a workflow. Sprocket can discover, analyze, and load a
document together with its imported dependencies. See
[Inputs and targets](/concepts/inputs).

## Execution engine

The complete system that evaluates and runs WDL: Sprocket's orchestration
engine together with one or more execution runtimes. See the
[Execution model](/concepts/execution-model).

## Execution runtime / backend

The component that carries out dispatched task work in a particular
environment. The current command and configuration reference uses
**execution backend** for Docker, TES, LSF with Apptainer, and Slurm with
Apptainer implementations. See [Execution backends](/reference/backends/overview).

## Index

An optional, user-organized tree of relative symlinks under an output
directory's `index/` directory. `sprocket run --index-on <PATH>` links a run's
`outputs.json` and eligible file and directory outputs at a stable path without
copying them. See [Output indexing](/concepts/provenance#output-indexing).

## Input

A named value supplied to a task or workflow. A fully qualified input name
combines the target and input names, such as `main.name`; when you pass
`--target main`, Sprocket can prefix unqualified run inputs with `main`. See
[Inputs and targets](/concepts/inputs).

## `_latest`

A symlink under `runs/<target>/` that points to the most recent run directory
for that target. If Windows cannot create the symlink, the run continues
without it. See [The `_latest` symlink](/concepts/provenance#the-latest-symlink).

## Lint rule

An opinionated check from `wdl-lint` that promotes idiomatic, maintainable WDL.
Lint rules have tags and are enabled by `sprocket lint` or `sprocket check
--lint`. See [Lint and validation rules](/reference/lint-rules).

## Lock file

The experimental `sprocket.lock` file written by `sprocket dev lock`. It records
container image manifest checksums and the time they were resolved. Sprocket
0.31.0 does not yet consume this file during a run. See
[`sprocket dev lock`](/reference/cli/dev/lock).

## LSP / analyzer

The Language Server Protocol service started by `sprocket analyzer`. Editor
clients use it for diagnostics, navigation, references, renaming, formatting,
semantic highlighting, and snippets. See
[`sprocket analyzer`](/reference/cli/analyzer).

## Module

An experimental reusable WDL project described by `module.json`. Its resolved
dependencies are recorded separately in `module-lock.json`. See
[`sprocket dev module`](/reference/cli/dev/module).

## Orchestration engine

The part of Sprocket that evaluates workflows, stages data, connects inputs and
outputs, schedules and monitors calls, and dispatches task work to an execution
runtime. See the [Execution model](/concepts/execution-model).

## Output

A named value produced by a task or workflow. Sprocket serializes run outputs
to `outputs.json`; the output index can also link file and directory outputs.
See [Run contents](/concepts/provenance#run-contents).

## Output directory

The self-contained directory where Sprocket stores execution data. It defaults
to `./out` and contains the provenance database, immutable `runs/` hierarchy,
and optional `index/` hierarchy. See
[Output directory](/concepts/provenance#output-directory).

## Provenance database

The `sprocket.db` SQLite database in the output directory. It records sessions,
runs, and task executions, using paths relative to the database so the output
directory remains portable. Its schema is internal and may change in any
release, so query it through Sprocket's commands or REST API rather than
directly. See
[Provenance database](/concepts/provenance#provenance-database).

## Retry

Another attempt after a task fails. Configuration and a task's `maxRetries`
value control how many retries Sprocket permits; `--disable-retries` disables
them for one local run. See [Retries](/reference/cli/run#retries).

## Run

One execution of a selected task or workflow, with its inputs, outputs, and
status. Sprocket stores each run in a timestamped directory under
`runs/<target>/`. See [Runs and the index](/concepts/provenance#runs-and-the-index).

## Session

A group of related run submissions in the provenance database. Each
`sprocket run` invocation creates a session; one `sprocket dev server start`
process creates a session shared by the runs submitted to that server. See
[Sessions](/reference/rest-api#sessions).

## SIF

A Singularity Image Format (`.sif`) container image used by Apptainer-based
execution backends. Sprocket can keep images per run under
`apptainer-images/` or use a configured shared image cache. See
[Containers](/concepts/containers).

## `.sprocketignore`

An ignore file that controls WDL document discovery. Its patterns work like
`.gitignore` patterns and apply to the file's directory and its descendants.
See [Ignoring WDL files and directories](/concepts/configuration#ignoring-wdl-files-and-directories).

## `sprocket.toml`

Sprocket's configuration file. Sprocket merges configuration from system,
executable-adjacent, working-directory, environment, and command-line sources
according to its
[configuration load order](/concepts/configuration#load-order). The
[configuration reference](/reference/configuration) lists every key.

## Target

The task or workflow selected for an operation such as running, validating, or
generating an input template. Sprocket can often infer a run target from
fully qualified inputs, a document's workflow, or its sole task; use
`--target` when selection is ambiguous. See [Targets](/concepts/inputs).

## Task

A WDL unit of computation with inputs, a command, requirements or runtime
settings, and optional outputs. A workflow invokes a task through a call, and
Sprocket sends the resulting work to an execution backend. See the
[Execution model](/concepts/execution-model).

## Validation rule

A WDL form or analysis check from `wdl-analysis`. Validation rules run under
both `sprocket check` and `sprocket lint` and do not expose lint tags. See
[Lint and validation rules](/reference/lint-rules).

## WDL

The [Workflow Description Language](https://openwdl.org), the open workflow
language that Sprocket parses, analyzes, and executes. See
[Open, tailored standard](/about/philosophy#open-tailored-standard).

## Workflow

A WDL graph that declares inputs and outputs and connects task calls and
expressions. Sprocket evaluates the workflow locally and dispatches ready task
work to its configured execution backend. See the
[Execution model](/concepts/execution-model).

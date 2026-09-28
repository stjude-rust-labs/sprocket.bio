---
title: Migrating from Cromwell or miniwdl
description: "Conceptual mapping from Cromwell and miniwdl to Sprocket for teams moving existing WDL workflows."
---

<!-- Sources: https://cromwell.readthedocs.io/en/stable/CommandLine/ (stable, accessed 2026-09-24), https://cromwell.readthedocs.io/en/stable/wf_options/Overview/ (stable, accessed 2026-09-24), https://cromwell.readthedocs.io/en/stable/cromwell_features/CallCaching/ (stable, accessed 2026-09-24), https://cromwell.readthedocs.io/en/stable/Configuring/ (stable, accessed 2026-09-24), https://cromwell.readthedocs.io/en/stable/backends/Backends/ (stable, accessed 2026-09-24), https://cromwell.readthedocs.io/en/stable/backends/HPC/ (stable, accessed 2026-09-24), https://miniwdl.readthedocs.io/en/latest/getting_started.html (latest, accessed 2026-09-24), https://miniwdl.readthedocs.io/en/latest/runner_reference.html (latest, accessed 2026-09-24) -->

# Migrating from Cromwell or miniwdl

Your WDL is the portable part. If you already run workflows with
[Cromwell](https://cromwell.readthedocs.io/) or
[miniwdl](https://miniwdl.readthedocs.io/), the documents themselves are what
moves to Sprocket; the machinery around them does not.

This page maps familiar concepts onto their Sprocket counterparts. The
comparisons are analogies meant to orient you, not compatibility claims: the
tools are independent implementations and behave differently in detail.

## What carries over, and what does not

Carries over:

- **The WDL documents.** Sprocket is a WDL engine; your tasks and workflows are
  the input.
- **Inputs JSON.** Cromwell-style inputs files, with keys that are fully
  qualified names such as `my_workflow.sample_name`, are accepted by Sprocket
  when you prefix the file with `@`. miniwdl accepts the same style of file
  with `--input`.
- **Container images.** Both other engines pull images from registries, and so
  does Sprocket.

Does not carry over:

- **Configuration files.** Cromwell is configured with HOCON files and
  `backend.providers` stanzas; miniwdl reads an INI-style `.cfg`. Sprocket
  reads TOML (`sprocket.toml`). Settings must be rewritten by hand; see
  [configuration](/concepts/configuration) and the [configuration file
  reference](/reference/configuration).
- **Cromwell workflow options.** Cromwell's separate `-o options.json` file has
  no Sprocket equivalent. Its settings map to Sprocket configuration keys or
  command-line flags instead.
- **Call caches.** None of the three engines can read another's cache. Your
  first Sprocket run of an existing workflow recomputes everything.
- **Run metadata.** Cromwell's metadata endpoints and miniwdl's `error.json`
  have no direct equivalent; Sprocket records runs in a SQLite provenance
  database instead (see [provenance
  tracking](/concepts/provenance)).

## Running a workflow

| Task | Cromwell | miniwdl | Sprocket |
|------|----------|---------|----------|
| Run a workflow | `java -jar cromwell.jar run wf.wdl -i inputs.json` | `miniwdl run wf.wdl --input inputs.json` | `sprocket run wf.wdl @inputs.json` |
| Inputs on the command line | not supported | `name=value` | `name=value` |
| Choose what to run | the document's workflow | the document's workflow | `--target`, or inferred when unambiguous |
| More logging | configure logging | `--verbose` | `-v` (repeatable) |
| Static checks | — | `miniwdl check` | [`sprocket check`](/reference/cli/check-lint) and `sprocket lint` |
| Check inputs first | — | — | [`sprocket validate`](/reference/cli/validate) |

Two differences are worth internalizing early:

- **Fully qualified keys.** miniwdl accepts bare input names on the command
  line because the target is unambiguous. Sprocket expects fully qualified
  names (`main.name=World`) unless you pass `--target`, which prefixes
  unqualified keys for you.
- **The `@` prefix.** An inputs file is passed as `@inputs.json`, not
  `inputs.json`. Inputs are applied incrementally, so you can layer a file and
  then override single values on the command line. See [inputs and
  targets](/concepts/inputs).

## Where results land

Cromwell writes to `cromwell-executions/<workflow_uuid>/call-<call_name>/`,
with each call's inputs localized into an `inputs` directory and its script,
`stdout`, and `stderr` under `execution`. Copying final outputs somewhere
stable is a workflow option (`final_workflow_outputs_dir`).

miniwdl creates a timestamped run directory per invocation containing
`workflow.log`, `outputs.json`, a `call-<name>` subdirectory per call with
`work/`, `stdout.txt`, and `stderr.txt`, an `out/` tree of symlinks to output
files, and a `_LAST` symlink to the most recent run.

Sprocket's layout is closest to miniwdl's:

| Concept | Cromwell | miniwdl | Sprocket |
|---------|----------|---------|----------|
| Run directory | `cromwell-executions/<uuid>/` | `<timestamp>_<workflow>/` | `out/runs/<target>/<timestamp>/` |
| Most recent run | — | `_LAST` | `_latest` |
| Per-call directory | `call-<name>/` | `call-<name>/` | `calls/<task_call_id>/` |
| Task working directory | `call-<name>/execution/` | `call-<name>/work/` | `attempts/<n>/work/` |
| Task logs | `execution/stdout`, `execution/stderr` | `stdout.txt`, `stderr.txt` | `attempts/<n>/stdout`, `attempts/<n>/stderr` |
| Engine log | workflow log directory | `workflow.log` | `output.log` |
| Serialized outputs | metadata / outputs endpoint | `outputs.json` | `outputs.json` |
| Stable links to outputs | `final_workflow_outputs_dir` | `out/` | `--index-on` writes `index/<path>/` |

Sprocket also keeps every retry attempt as its own numbered directory, and
records each run in `sprocket.db`. See [provenance
tracking](/concepts/provenance) and
[troubleshooting](/guides/troubleshooting).

## Call caching

All three engines cache task results, and all three have it off by default.

Cromwell keys its cache on the command and inputs, stores it in its database,
and, for local files, lets you pick a hashing strategy: `md5` (the default),
`xxh64`, `path`, `path+modtime`, or `fingerprint`, which combines a file's last
modified time, its size, and a hash of its first 10 MB.

miniwdl keys its cache on digests of the WDL source and the inputs, stores
entries as JSON files under a cache directory, and invalidates an entry when a
referenced local file's modification time changes. `--no-cache` disables it for
one run.

Sprocket enables caching with `run.task.cache` (`"on"` or `"explicit"`),
disables it for a single run with `--no-call-cache`, and offers three digest
modes: `weak` (metadata only, the default), `strongish`, and `strong` (full
content hash). `strongish` hashes a file's size, last modified time, and first
10 MiB, which makes it similar in spirit to Cromwell's `fingerprint` strategy —
similar, not identical. See [call caching](/concepts/call-caching).

Because the caches are independent, plan for a full recomputation on your first
Sprocket run.

## Backends

Cromwell ships Local, HPC (SGE, LSF, SLURM, HTCondor), Google Cloud, GA4GH TES,
and AWS Batch backends, configured under `backend.providers`. miniwdl runs
tasks locally through Docker and relies on separately maintained extensions for
SLURM and AWS Batch.

Sprocket configures one or more backends in `sprocket.toml` under
`[run.backends.<name>]`:

| Backend | Use it for |
|---------|-----------|
| [Docker](/reference/backends/docker) | Local execution, including Docker Swarm |
| [LSF](/reference/backends/lsf) | An LSF cluster with Apptainer ([guide](/guides/lsf)) |
| [Slurm](/reference/backends/slurm) | A Slurm cluster with Apptainer ([guide](/guides/slurm)) |
| [TES](/reference/backends/tes) | A GA4GH TES server ([guide](/guides/tes)) |

See [execution backends](/reference/backends/overview) for how backends are
selected, and [cloud storage](/reference/storage/overview) for reading and
writing inputs and outputs in Azure Blob Storage, Amazon S3, or Google Cloud
Storage.

## Configuration habits

| Cromwell / miniwdl habit | Sprocket equivalent |
|---|---|
| `-Dconfig.file=...` (Cromwell) or `--cfg` / `MINIWDL_CFG` (miniwdl) | `--config`, `SPROCKET_CONFIG`, or a `sprocket.toml` Sprocket finds on its own |
| Layered defaults, file, environment, command line | The same idea; see [load order](/concepts/configuration#load-order) |
| `workflow_failure_mode` (Cromwell) | `run.fail` (`"slow"` waits for running tasks, `"fast"` cancels them) |
| `default_runtime_attributes` for a default image (Cromwell) or `[task_runtime] defaults` (miniwdl) | `run.task.container` |
| `concurrent-job-limit` (Cromwell) | `max_concurrency` on the backend, plus `run.workflow.scatter.concurrency` |
| `miniwdl configure` to see effective settings | [`sprocket config`](/reference/cli/config) |

## A few behavioral differences

- **Retries.** Sprocket keeps every attempt on disk and never caches a task
  that only succeeded after a retry. See [retries](/reference/cli/run#retries).
- **GPUs.** miniwdl ignores `gpu` requirements. Sprocket's Docker and HPC
  backends act on them; its TES backend does not.
- **Server mode.** Cromwell's server is its production mode. Sprocket's
  [`sprocket dev server`](/reference/cli/dev/server) is experimental, and
  `sprocket run` is the supported way to execute workflows today.

If something in your Cromwell or miniwdl setup has no obvious counterpart here,
ask — see [community and support](/about/community).

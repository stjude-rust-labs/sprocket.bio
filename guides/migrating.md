---
title: Migrating from Cromwell or miniwdl
description: "How Cromwell and miniwdl commands, inputs, output directories, configuration, caching, and backends translate to Sprocket."
---

<!-- Sources: https://github.com/stjude-rust-labs/sprocket@v0.33.0, https://cromwell.readthedocs.io/en/stable/CommandLine/ (stable, accessed 2026-11-17), https://cromwell.readthedocs.io/en/stable/WOMtool/ (stable, accessed 2026-11-17), https://cromwell.readthedocs.io/en/stable/wf_options/Overview/ (stable, accessed 2026-11-17), https://cromwell.readthedocs.io/en/stable/execution/ExecutionTwists/ (stable, accessed 2026-11-17), https://cromwell.readthedocs.io/en/stable/cromwell_features/CallCaching/ (stable, accessed 2026-11-17), https://cromwell.readthedocs.io/en/stable/Configuring/ (stable, accessed 2026-11-17), https://cromwell.readthedocs.io/en/stable/backends/Backends/ (stable, accessed 2026-11-17), https://cromwell.readthedocs.io/en/stable/backends/HPC/ (stable, accessed 2026-11-17), https://miniwdl.readthedocs.io/en/latest/getting_started.html (latest, accessed 2026-11-17), https://miniwdl.readthedocs.io/en/latest/runner_reference.html (latest, accessed 2026-11-17), https://miniwdl.readthedocs.io/en/latest/runner_cli.html (latest, accessed 2026-11-17) -->

## Migrating from Cromwell or miniwdl

Sprocket runs WDL 1.0 and later workflows and reads the JSON input files used by
[Cromwell](https://cromwell.readthedocs.io/) and [miniwdl](https://miniwdl.readthedocs.io/). Moving
an existing pipeline to Sprocket means updating your CLI commands, rewriting engine settings in
`sprocket.toml`, and adjusting any wrapper scripts that read run directories or metadata.

### Checking existing WDL

Start by validating your workflow entrypoint with [`sprocket check`](/reference/cli/check-lint):

```shell
sprocket check wf.wdl
```

`sprocket check` validates the document and its imports against the WDL specification, replacing
`womtool validate` and `miniwdl check`. Older repositories commonly hit two differences:

- Every file needs a `version` statement (`1.0` or later). Pre-1.0 (`draft-2`) files with no
  `version` header are not supported and must be updated to at least `version 1.0`. Files that
  declare `version development` need either a released version header or
  [`common.wdl.fallback_version`](/reference/configuration#common-wdl-fallback-version) set in
  `sprocket.toml`.
- Sprocket enforces optional-type rules strictly and has no equivalent to
  `miniwdl run --no-quant-check`.

Sprocket resolves relative file paths and `http://` or `https://` URLs directly from `import`
statements; there is no separate `--imports` ZIP bundle.

`sprocket lint` runs style and portability rules alongside validation. If an existing repository
produces more lint warnings than you want to fix right away, `sprocket lint --generate-baseline`
records them in `sprocket-baseline.toml` so CI only flags new issues; see
[baselines](/reference/cli/check-lint#baselines).

### Running workflows and passing inputs

| Task | Cromwell | miniwdl | Sprocket |
| --- | --- | --- | --- |
| Run with an inputs file | `java -jar cromwell.jar run wf.wdl -i inputs.json` | `miniwdl run wf.wdl -i inputs.json` | `sprocket run wf.wdl @inputs.json` |
| Set an input on the CLI | not supported | `key=value` | `key=value` |
| Pick a task or workflow | workflow only | workflow, or `--task <name>` | `--target <name>` (`-t`), or inferred when unambiguous |
| Validate WDL | `java -jar womtool.jar validate wf.wdl` | `miniwdl check wf.wdl` | [`sprocket check wf.wdl`](/reference/cli/check-lint) |
| Generate an inputs file | `java -jar womtool.jar inputs wf.wdl` | `miniwdl input_template wf.wdl` | [`sprocket inputs wf.wdl`](/reference/cli/inputs) |
| Validate inputs before a run | — | `miniwdl run wf.wdl -i inputs.json --json` | [`sprocket validate wf.wdl @inputs.json`](/reference/cli/validate) |
| Verbose logging | `-DLOG_LEVEL=...` | `--verbose` (`-v`) | `-v` (`-vv`, `-vvv`) |

Prefix JSON or YAML input files with `@` on the command line (`@inputs.json`). You can combine input
files with per-run `key=value` arguments:

```shell
sprocket run wf.wdl @defaults.json my_workflow.sample="NA12878"
```

Unlike `miniwdl run`, passing `key=value` for a key already present in an earlier `@file` combines
the values into an `Array` instead of replacing the key. Leave per-run keys out of `@defaults.json`,
or pass a later `@overrides.json` file to replace matching keys.

Without `--target`, input keys in files and on the command line must include the workflow or task
name (`my_workflow.sample`), matching Cromwell's inputs JSON format. Passing `--target my_workflow`
lets you drop that prefix (`sample="NA12878"`) in both places, like miniwdl's command-line inputs.
Relative `File` and `Directory` paths inside an input file resolve against the directory containing
that file (like miniwdl, unlike Cromwell's working-directory resolution), while relative paths in
command-line `key=value` arguments resolve against the current working directory. See
[inputs and targets](/concepts/inputs) for array inputs and target inference.

Cromwell's per-run workflow options file (`-o options.json`) has no direct counterpart. Pass per-run
flags to `sprocket run` or put persistent settings in `sprocket.toml`.

### Output directory and metadata

By default, `sprocket run` writes under `./out` (override with `-o` or `run.output_dir`), using
timestamped run directories similar to miniwdl's:

| Artifact | Cromwell | miniwdl | Sprocket |
| --- | --- | --- | --- |
| Run directory | `cromwell-executions/<workflow>/<uuid>/` | `<timestamp>_<target>/` | `out/runs/<target>/<timestamp>/` |
| Latest run symlink | — | `_LAST` | `out/runs/<target>/_latest` |
| Call directory | `call-<name>/` | `call-<name>/` | `calls/<task_call_id>/` (workflow runs) |
| Task working directory | `call-<name>/execution/` | `call-<name>/work/` | `attempts/<n>/work/` |
| Task logs | `execution/stdout`, `execution/stderr` | `stdout.txt`, `stderr.txt` | `attempts/<n>/stdout`, `attempts/<n>/stderr` |
| Runner log | configured log directory | `workflow.log` or `task.log` | `output.log` |
| Resolved inputs and outputs | `-m metadata.json` or REST API | `outputs.json` (`error.json` on failure) | `inputs.json`, `outputs.json` |
| Stable output paths | `final_workflow_outputs_dir` | `out/` | `--index-on <path>` writes `out/index/<path>/` |

Each task attempt gets its own numbered directory (`attempts/0/`, `attempts/1/`, and so on), so a
retry does not overwrite logs from an earlier failure. When you run a standalone task, `attempts/`
sits at the top of the run directory instead of under `calls/`.

Sprocket records run history in `out/sprocket.db` rather than writing Cromwell's metadata JSON or
miniwdl's `error.json`. Unlike miniwdl, Sprocket treats both `sprocket.db` and the internal layout
of `runs/` as unstable implementation details. Wrapper scripts that collect results should read
`outputs.json` or pass `--index-on <path>` to create stable symlinks under `out/index/<path>/`. See
[provenance tracking](/concepts/provenance) and [troubleshooting](/guides/troubleshooting).

### Configuration

Cromwell uses HOCON configuration files (`-Dconfig.file=...`) plus `options.json`, and miniwdl reads
INI-style `.cfg` files (`--cfg` or `MINIWDL_CFG`). Sprocket reads TOML (`sprocket.toml`), merging
settings from system-wide and executable-adjacent locations, `./sprocket.toml`, `SPROCKET_CONFIG`,
and `--config`; see [configuration](/concepts/configuration) and the
[configuration reference](/reference/configuration).

| Cromwell or miniwdl setting | Sprocket equivalent |
| --- | --- |
| `-Dconfig.file=...` (Cromwell), `--cfg` / `MINIWDL_CFG` (miniwdl) | `--config`, `SPROCKET_CONFIG`, or `./sprocket.toml` |
| `miniwdl configure` | [`sprocket config resolve`](/reference/cli/config) (`sprocket config default` prints defaults) |
| `workflow_failure_mode` (Cromwell) | `run.fail = "slow"` (default, like `NoNewCalls`) waits for running tasks; `"fast"` cancels them (`ContinueWhilePossible` has no equivalent) |
| `default_runtime_attributes` container (Cromwell), `[task_runtime] defaults` (miniwdl) | `run.task.container` (defaults to `"ubuntu:latest"`) |
| Default `maxRetries` in runtime defaults | `run.task.retries` (`--disable-retries` disables retries for one run) |
| Automatic clamping of `cpu` / `memory` to host limits (miniwdl) | Errors by default (`"deny"`); set `run.task.cpu_limit_behavior` and `run.task.memory_limit_behavior` to `"try_with_max"` to clamp |
| `concurrent-job-limit` (Cromwell), `[scheduler] task_concurrency` (miniwdl) | No global running-job cap: Docker and Local schedule by host CPU and memory, `run.workflow.scatter.concurrency` caps elements per scatter, and Slurm, LSF, or the TES server enforce remote job limits (backend `max_concurrency` only throttles submission or API calls) |

### Call caching

All three engines disable call caching by default, and none of them can read another engine's cache,
so the first run of an existing workflow in Sprocket executes every task.

Enable Sprocket's cache in `sprocket.toml`:

```toml
[run.task]
cache = "on"
digests = "weak"
```

Setting `cache = "on"` caches every task unless it sets `cacheable: false` in `hints` (or `runtime`
before WDL 1.2); `cache = "explicit"` caches only tasks that set `cacheable: true`. Pass
`--no-call-cache` on `sprocket run` to skip the cache for one run, matching
`miniwdl run --no-cache`.

`run.task.digests` controls how Sprocket checks input and output files for modifications:

- `"weak"` (default) checks file metadata such as size and modification time, similar to miniwdl's
  local file checks and Cromwell's `path+modtime`.
- `"strongish"` hashes file size, modification time, and the first 10 MiB of content, similar to
  Cromwell's `fingerprint` strategy.
- `"strong"` hashes the full file contents, like Cromwell's default `md5` local strategy.

See [call caching](/concepts/call-caching) for cache directories, invalidation rules, and excluding
inputs or requirements from cache checks.

### Backends and server mode

With no backend configured, Sprocket runs tasks locally in [Docker](/reference/backends/docker)
containers. Other backends are configured under `[run.backends.<name>]` in `sprocket.toml`:

| Backend | Configuration `type` | Replaces |
| --- | --- | --- |
| [Docker](/reference/backends/docker) | `"docker"` | Cromwell `Local` with Docker, miniwdl default / Swarm |
| [Local](/reference/configuration#run-backends-name-local) | `"local"` | Cromwell `Local` without containers (trusted WDL only) |
| [LSF](/guides/lsf) | `"lsf_apptainer"` | Cromwell `LSF` provider |
| [Slurm](/guides/slurm) | `"slurm_apptainer"` | Cromwell `SLURM` provider, `miniwdl-slurm` |
| [TES](/guides/tes) | `"tes"` | Cromwell `TES` provider, cloud batch via a GA4GH TES server |

The LSF and Slurm backends run containers with Apptainer rather than Docker and are currently
experimental. Docker, LSF, and Slurm honor WDL `gpu` requirements, which miniwdl's built-in runner
ignores; the TES backend does not. See [execution backends](/reference/backends/overview) and
[containers](/concepts/containers).

Sprocket does not ship dedicated AWS Batch or Google Cloud Batch backends; cloud batch execution
goes through a [TES server](/guides/tes). For cloud-hosted files, Sprocket reads and writes
[Amazon S3](/reference/storage/s3), [Google Cloud Storage](/reference/storage/gcs), and
[Azure Blob Storage](/reference/storage/azure) URLs directly without external plugins; see
[cloud storage](/reference/storage/overview).

If you run Cromwell in `server` mode in production, note that
[`sprocket dev server`](/reference/cli/dev/server) and its [REST API](/reference/rest-api) are still
experimental. `sprocket run` is the supported way to run workflows today.

If part of your Cromwell or miniwdl setup has no clear equivalent here, ask in `#sprocket` on the
OpenWDL Slack or open a GitHub discussion; see [community and support](/about/community).

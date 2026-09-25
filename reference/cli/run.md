---
description: "Run WDL tasks and workflows with sprocket run: targets, inputs, execution backends, retries, and output directories."
---

# `sprocket run`

Individual tasks and workflows can be run with the `sprocket run` subcommand. We
outline a few of the important considerations below, but we encourage you to run
`sprocket run --help` to see all available arguments and options.

## Execution backends

See the section on [execution backends](/reference/backends/overview) to
learn more about configuring Sprocket to execute tasks in different
environments.

## Targets

The task or workflow to run is chosen with the `--target` (`-t`) argument.

```shell
sprocket run --target main example.wdl
```

The argument is optional. With no inputs, Sprocket infers the target from the
document; with inputs, it is required unless every input key is already prefixed
with the target's name. When `--target` is supplied, Sprocket prepends it to any
unqualified input key, in files and on the command line alike. See
[Inputs and targets](/concepts/inputs#targets) for the details.

## Inputs

Inputs are passed as arguments after the WDL document. Each one is either a
key-value pair (e.g., `main.is_pirate=true`), an input file prefixed with `@`
(e.g., `@inputs.json` for JSON or `@inputs.yaml` for YAML), or a bare value that
is appended to the preceding key's array. Inputs are applied incrementally, so
later inputs override earlier ones.

```bash
sprocket run example.wdl @hello_defaults.json main.name="Ari"
```

See [Inputs and targets](/concepts/inputs#inputs) for the full rules, including
the required `@` prefix, [array inputs](/concepts/inputs#array-inputs), and a
worked example. The [guided tour](/getting-started/guided-tour#running-tasks-and-workflows)
walks through a complete run.

## Retries

A task can request retries through `runtime.maxRetries` or
`requirements.maxRetries`. The `run.task.retries` configuration setting
provides the default when a task does not specify one, and
`server.engine.task.retries` is the equivalent setting for
[`sprocket dev server`](/reference/cli/dev/server):

```toml
[run.task]
retries = 2

[server.engine.task]
retries = 2
```

The accepted values are `"default"` (Sprocket's own default) or an integer from
`0` through `99`. Setting the value to `0` only changes the default; a task can
still request retries with its own `maxRetries` value.

Pass `--disable-retries` to disable retries for every task in one run. This flag
takes precedence over both `run.task.retries` and a task's `maxRetries` value.

## Output directory

By default, `sprocket run` writes all execution artifacts to `./out`. This can
be changed with the `-o, --output-dir` flag.

```shell
sprocket run example.wdl --target main name="World" -o /path/to/output
```

Individual runs are stored at `<output_dir>/runs/<target>/<timestamp>/`, and a
`_latest` symlink is maintained for each target pointing to its most recent run.
The output directory also contains a SQLite provenance database (`sprocket.db`)
that tracks all executions. The database schema and the layout of `runs/` are
internal and may change in any release; see
[Querying execution history](/concepts/provenance#querying-execution-history).

The `--suffix` flag appends a user-defined string to the run directory name,
producing `<timestamp>_<suffix>` instead of just `<timestamp>`. This is useful
for identifying runs at a glance:

```shell
sprocket run example.wdl --target main name="World" --suffix experiment-1
```

This changes the run directory from `out/runs/main/<timestamp>/` to
`out/runs/main/<timestamp>_experiment-1/`.

The `--index-on` flag takes a path within `<output_dir>/index/` and symlinks the
run's `outputs.json` along with every output that is a `File`, a `Directory`, or
an array of them into it, giving results a stable location that does not change
with each run's timestamp. The path is relative, cannot contain `.` or `..`
components, and is used verbatim, so group results by a value of your own
choosing by interpolating that value into the index path in your shell:

```shell
sprocket run hello.wdl -t hello --index-on greeting
```

For full details on the output directory structure, provenance database, and
output indexing, see the
[Provenance Tracking](/concepts/provenance) documentation.

## Interrupting a run

With the default `run.fail = "slow"` setting, the first Ctrl-C waits for
executing tasks to complete. A second Ctrl-C asks those tasks to cancel, and a
third terminates Sprocket immediately. When the Docker backend is active,
Sprocket warns on the second Ctrl-C that running containers will remain and
that files created by those containers may require elevated privileges to
remove.

Set `run.fail = "fast"` to skip the completion wait. In that mode, the first
Ctrl-C starts task cancellation and the second terminates Sprocket.

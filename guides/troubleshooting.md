---
title: Troubleshooting
description: "How to diagnose a failed Sprocket run using the run output directory, logs, and validation commands."
---

# Troubleshooting

When a run fails, Sprocket leaves everything it did on disk. This guide shows
where to look, then lists the errors people hit most often and what to do about
each one.

## Debugging a failed run

### Start at the run directory

Every run writes to `<output_dir>/runs/<target>/<timestamp>/`, where the output
directory is `./out` unless you passed `-o`. The `_latest` symlink for a target
points at its most recent run, so you can go straight there:

```shell
ls out/runs/my_workflow/_latest/
```

::: info Note
On Windows, creating the `_latest` symlink may require administrator
privileges or Developer Mode. If it cannot be created, the run still proceeds
without it and you navigate to the timestamped directory instead. See
[provenance tracking](/concepts/provenance#the-latest-symlink).
:::

Two files at the top of the run directory answer most first questions:

| File | What it tells you |
|------|-------------------|
| `output.log` | Every message emitted during the run, including ones scrolled past in the terminal |
| `inputs.json` | The inputs Sprocket actually used, after merging every file and key-value pair |

If a run did not do what you expected, check `inputs.json` before anything
else. It is the resolved result of [incremental input
application](/concepts/inputs), so it shows which value won.

### Find the failing task's attempt

Where attempts live depends on what you ran:

- **Task runs** put them at the top level of the run directory:
  `runs/<target>/<timestamp>/attempts/<n>/`.
- **Workflow runs** put them under the call they belong to:
  `runs/<target>/<timestamp>/calls/<task_call_id>/attempts/<n>/`.

Attempts are numbered from `0`, and a retried task keeps every attempt, which
is how you compare a failure against a later success. Each attempt directory
contains:

| File | Contents |
|------|----------|
| `command` | The shell script that was executed, with all WDL placeholders substituted |
| `stdout` | Standard output from the task |
| `stderr` | Standard error from the task |
| `work/` | The task's working directory, including any files it produced |

Read `stderr` first, then `command` to confirm the tool was invoked the way you
intended. [Directory
structure](/concepts/provenance#directory-structure) documents the full layout,
including the backend-specific files that HPC backends add next to these.

### Turn up the verbosity

`-v` increases logging verbosity and can be repeated (`-vv`, `-vvv`); `-q`
decreases it. Verbose output covers decisions that are otherwise silent, such
as why a call cache entry was or was not used.

```shell
sprocket run -v workflow.wdl --target main
```

### Check before you run

Two commands catch problems without starting any containers:

- `sprocket validate` checks a set of inputs against a task or workflow, so you
  learn about a missing or misspelled input immediately rather than after
  localization. See [`sprocket validate`](/reference/cli/validate).
- `sprocket check` (and `sprocket lint`) analyze the document itself for
  errors, warnings, and style problems. See [`sprocket check` and `sprocket
  lint`](/reference/cli/check-lint).

```shell
sprocket check workflow.wdl
sprocket validate workflow.wdl --target main @inputs.json
```

## Common errors

### A target cannot be inferred

```txt
error: a target cannot be inferred because the document contains multiple tasks and no workflow
```

Sprocket runs the document's workflow if it has one, or its only task if it has
exactly one. Anything else is ambiguous, so name what you want with `--target`:

```shell
sprocket run hello.wdl --target say_hello
```

A `target not found` error means the name does not exist in the document; check
its spelling against the task and workflow names. See [inputs and
targets](/concepts/inputs).

### Missing a required input

```txt
error: failed to validate the inputs to task `say_hello`

Caused by:
    missing required input `greeting` to task `say_hello`
```

Supply the input on the command line (`greeting="Hello"`) or in an inputs file.
`sprocket inputs` writes the inputs schema for a document (optionally for one
`--target`), which is the quickest way to see what a target accepts. A related
error, `does not have an input named ...`, means the key exists in your file
but not in the WDL — usually a typo or a stale inputs file.

### An inputs file without the `@` prefix

```txt
error: failed to parse inputs from `inputs.json`

Caused by:
    unrecognized input `inputs.json`: prefix input files with `@` (e.g., `@inputs.json`) or use `key=value` for inputs
```

Input files must be prefixed with `@`, which is what distinguishes them from
bare array values:

```shell
sprocket run workflow.wdl @inputs.json
```

### A resource request exceeds the maximum

A task that asks for more CPU or memory than the backend knows it can provide
fails before it is submitted. The Docker backend compares the request against
the host; the HPC backends compare it against a queue's or partition's
`max_cpu_per_task` and `max_memory_per_task`, when those are configured.
(Without them, an impossible job is submitted and stays pending — see below.)

You have two options: lower the request in the WDL, or let Sprocket clamp it.
Setting `cpu_limit_behavior` and `memory_limit_behavior` to `"try_with_max"`
runs the task with the maximum available instead of erroring:

```toml
[run.task]
cpu_limit_behavior = "try_with_max"
memory_limit_behavior = "try_with_max"
```

The default is `"deny"`. See [overriding task CPU and memory
requirements](/concepts/configuration#overriding-task-cpu-and-memory-requirements).

### Containers left behind after Ctrl-C

With the default `run.fail = "slow"` setting, the first Ctrl-C waits for
running tasks to finish, a second asks them to cancel, and a third terminates
Sprocket immediately. On the second Ctrl-C with the Docker backend, Sprocket
warns that running containers will remain and that files those containers
created may need elevated privileges to remove. Clean up with
`docker ps`/`docker rm`, and use `sudo` if a work directory refuses to delete.
See [interrupting a run](/reference/cli/run#interrupting-a-run).

### An HPC job stays pending forever

Sprocket applies only basic limits to scheduler jobs, so it can submit a job
whose CPU or memory request no queue or partition can satisfy. Such a job
remains pending indefinitely. Inspect it with your scheduler's tooling
(`bjobs -l <jobid>` or `scontrol show job <jobid>`), then either adjust the
request or set the queue's or partition's `max_cpu_per_task` and
`max_memory_per_task` so Sprocket can catch the problem up front. Too-high
scatter concurrency can overwhelm the scheduler in the same way. See the known
issues for [LSF](/reference/backends/lsf#known-issues) and
[Slurm](/reference/backends/slurm#known-issues), and the guides for
[LSF](/guides/lsf) and [Slurm](/guides/slurm).

Error reporting on these backends is based on inspecting the output of
command-line tools, so the message printed at the terminal is often less
informative than the files left in the run directory.

### A cached call was not reused

The call cache is off by default and must be enabled with `run.task.cache`. Once
it is on, Sprocket logs an `INFO` message when it reuses or invalidates an
entry; pass `-v` to see those messages. Changing the document URI, task name,
input values, backend, evaluated command, or container invalidates an entry, and
a task that only succeeded on a retry is never cached. See [call
caching](/concepts/call-caching#logged-messages).

### Other backend-specific problems

Each backend page lists its own limitations and quirks:

- [Docker backend](/reference/backends/docker)
- [TES backend](/reference/backends/tes) and the [Run with TES](/guides/tes)
  guide
- [LSF backend](/reference/backends/lsf#known-issues)
- [Slurm backend](/reference/backends/slurm#known-issues)

## Getting help

If the run directory does not explain the failure, ask. [Community and
support](/about/community) lists the Slack channel, issue trackers, and
discussion forums where the Sprocket team and users answer questions. Include
the Sprocket version (`sprocket --version`), the backend you are using, and the
relevant part of `output.log` or the failing attempt's `stderr`.
